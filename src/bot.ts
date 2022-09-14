import { Context, Probot } from 'probot';
import { fetch } from 'cross-fetch';
import * as Sentry from '@sentry/node';

/* @probot/pino automatically picks up SENTRY_DSN from .env */
Sentry.init({
  environment: process.env.NODE_ENV,
  /* Do not send errors to sentry if app is in development mode */
  enabled: process.env.NODE_ENV !== 'development',
  tracesSampleRate: 1.0,
});

// Should be the same as in gitpoap-backend/src/routes/claims.ts
type BotClaimData = {
  id: number;
  gitPOAP: { id: number; poapEventId: number; threshold: number };
  user: { githubHandle: string },
  name: string;
  imageUrl: string;
  description: string;
};

function generateComment(claims: BotClaimData[]): string {
  let qualifier: string;
  if (claims.length > 1) {
    qualifier = `some GitPOAPs`;
  } else {
    qualifier = `a GitPOAP`;
  }

  let comment = `Woohoo, your important contribution to this open-source project has earned you ${qualifier}!\n`;

  for (const claim of claims) {
    comment += `
[**${claim.name}**](https://www.gitpoap.io/gp/${claim.gitPOAP.id}):
<img alt="${claim.name} GitPOAP Badge" src="${claim.imageUrl}" height="200px">`;
  }

  comment +=
    '\n\nHead on over to [GitPOAP.io](https://www.gitpoap.io) and connect your GitHub account to mint!';

  return comment;
}

function generateIssueComment(claims: BotClaimData[]): string {
  let qualifier: string;
  if (claims.length > 1) {
    qualifier = `some GitPOAPs`;
  } else {
    qualifier = `a GitPOAP`;
  }

  const receivers = claims.map(claim => claim.user.githubHandle);
  const uniqueReceivers = Array.from(new Set(receivers));
  const receiversTag = uniqueReceivers.reduce((acc, ele) => acc + `@${ele} `, "");
  let comment = `Congrats, ${receiversTag}! You've earned ${qualifier} for your contribution!\n`;

  for (const claim of claims) {
    comment += `
[**${claim.name}**](https://www.gitpoap.io/gp/${claim.gitPOAP.id}):
<img alt="${claim.name} GitPOAP Badge" src="${claim.imageUrl}" height="200px">`;
  }

  comment +=
    '\n\nHead on over to [GitPOAP.io](https://www.gitpoap.io) and connect your GitHub account to mint if you haven’t already!';

  return comment;
}

export default (app: Probot) => {
  app.on('pull_request.closed', async (context: Context<'pull_request.closed'>) => {
    // Don't handle closed but not merged PRs
    if (!context.payload.pull_request.merged) {
      return;
    }

    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;
    const pullRequestNumber = context.payload.number;

    context.log.info(
      `Handling newly merged PR: https://github.com/${owner}/${repo}/${pullRequestNumber}`,
    );

    // Skip claims creation API request if the creator of the PR is a bot
    if (context.payload.pull_request.user.type === 'Bot') {
      context.log.info(
        `Skipping creating claims for PR made by bot "${context.payload.pull_request.user.login}"`
      );
      return;
    }

    const octokit = await app.auth(); // Not passing an id returns a JWT-authenticated client
    const jwt = (await octokit.auth({ type: 'app' })) as { token: string };

    const res = await fetch(`${process.env.API_URL}/claims/gitpoap-bot/create`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt.token}`,
      },
      body: JSON.stringify({
        repo,
        owner,
        pullRequestNumber,
      }),
    });

    if (res.status !== 200) {
      context.log.error(`An issue occurred (response code: ${res.status}): ${await res.text()}`);
      return;
    }

    const response = await res.json();

    if (response.newClaims.length === 0) {
      context.log.info('No new claims were created by this PR');
      return;
    }

    context.log.info(`${response.newClaims.length} new Claims were created by this PR`);

    const issueComment = context.issue({
      body: generateComment(response.newClaims),
    });

    const result = await context.octokit.issues.createComment(issueComment);

    context.log.info(`Posted comment about new claims: ${result.data.html_url}`);
  });

  app.on("issue_comment.created", async (context: Context<'issue_comment.created'>) => {
    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;
    const organization = context.payload.organization?.login ?? "";
    const sender = context.payload.sender.login;
    const comment = context.payload.comment.body;
    const issueNumber = context.payload.issue.number;
    const issueCreatorId = context.payload.issue.user.id;
    const htmlURL = context.payload.issue.html_url;

    const isPR = htmlURL?.includes(`/pull/${issueNumber}`);

    // check if comment sender is repo owner
    if(owner !== sender) {
      return;
    }
    // check if comment taggged gitpoap-bot
    if(!comment.includes("@gitpoap-bot")) {
      context.log.info(`Sender didn't tag @gitpoap-bot in this comment`);
      return;
    }
    // parse followed tagged contributors
    const tagBody = comment.split("@gitpoap-bot ")[1];
    const contributors = tagBody?.match(/@\w*/g)?.map(contributor => contributor.replace("@", "")).filter(contributor => contributor) ?? [];
    const uniqueContributors =  Array.from(new Set(contributors));
    // fetch github ids
    const contributorGithubIds: number[] = [];
    for(let contributor of uniqueContributors) {
      const id: number = await fetch(`https://api.github.com/users/${contributor}`).then(res => res.json()).then(res => res.id);
      contributorGithubIds.push(id)
    }
    // if there are no contributors tagged, we award GitPOAP(s) to the PR/issue creator
    if(contributorGithubIds.length === 0) {
      contributorGithubIds.push(issueCreatorId);
    }
    // create claims for these contributors via API endpoint
    const octokit = await app.auth(); // Not passing an id returns a JWT-authenticated client
    const jwt = (await octokit.auth({ type: 'app' })) as { token: string };

    const data = isPR ? {
      pullRequest: {
        organization,
        repo,
        pullRequestNumber: issueNumber,
        contributorGithubIds,
        wasEarnedByMention: true
      }
    } : {
      issue: {
        organization,
        repo,
        issueNumber,
        contributorGithubIds,
        wasEarnedByMention: false
      }
    }

    const res = await fetch(`${process.env.API_URL}/claims/gitpoap-bot/create`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt.token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.status !== 200) {
      context.log.error(`An issue occurred (response code: ${res.status}): ${await res.text()}`);
      return;
    }

    // create a comment to show info about gitpoap
    const response = await res.json();

    if (response.newClaims.length === 0) {
      context.log.info('No new claims were created by this PR');
      return;
    }

    context.log.info(`${response.newClaims.length} new Claims were created by this PR`);

    const issueComment = context.issue({
      body: generateIssueComment(response.newClaims),
    });

    const result = await context.octokit.issues.createComment(issueComment);

    context.log.info(`Posted comment about new claims: ${result.data.html_url}`);
  });
};
