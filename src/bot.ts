import { Context, Probot } from 'probot';
import { fetch } from 'cross-fetch';
import * as Sentry from '@sentry/node';
import { generateComment, generateIssueComment } from './comments';

/* @probot/pino automatically picks up SENTRY_DSN from .env */
Sentry.init({
  environment: process.env.NODE_ENV,
  /* Do not send errors to sentry if app is in development mode */
  enabled: process.env.NODE_ENV !== 'development',
  tracesSampleRate: 1.0,
});

export default (app: Probot) => {
  app.on('pull_request.closed', async (context: Context<'pull_request.closed'>) => {
    // Don't handle closed but not merged PRs
    if (!context.payload.pull_request.merged) {
      return;
    }

    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;
    const pullRequestNumber = context.payload.number;
    const senderId = context.payload.pull_request.user.id;
    const organization = context.payload.organization?.login ?? '';

    context.log.info(
      `Handling newly merged PR: https://github.com/${owner}/${repo}/${pullRequestNumber}`,
    );

    // Skip claims creation API request if the creator of the PR is a bot
    if (context.payload.pull_request.user.type === 'Bot') {
      context.log.info(
        `Skipping creating claims for PR made by bot "${context.payload.pull_request.user.login}"`,
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
        pullRequest: {
          organization,
          repo,
          pullRequestNumber: pullRequestNumber,
          contributorGithubIds: [senderId],
          wasEarnedByMention: false,
        },
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

  app.on('issue_comment.created', async (context: Context<'issue_comment.created'>) => {
    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;
    const organization = context.payload.organization?.login ?? '';
    const sender = context.payload.sender.login;
    const comment = context.payload.comment.body;
    const issueNumber = context.payload.issue.number;
    const issueCreatorId = context.payload.issue.user.id;
    const htmlURL = context.payload.issue.html_url;

    const isPR = htmlURL?.includes(`/pull/${issueNumber}`);
    
    // check if comment sender is repo owner
    if (owner !== sender) {
      return;
    }
    // check if comment taggged gitpoap-bot
    if (!comment.includes('@gitpoap-bot')) {
      context.log.info(`Sender didn't tag @gitpoap-bot in this comment`);
      return;
    }
    // parse followed tagged contributors
    const tagBody = comment.split('@gitpoap-bot ')[1];
    const contributors =
      tagBody
        ?.match(/@\w*/g)
        ?.map((contributor) => contributor.replace('@', ''))
        .filter((contributor) => contributor) ?? [];
    const uniqueContributors = Array.from(new Set(contributors));
    // fetch github ids
    const contributorGithubIds: number[] = [];
    for (let contributor of uniqueContributors) {
      const res = await context.octokit.users.getByUsername({
        username: contributor,
      });
      const user = res.data;

      if (user && user.id) {
        contributorGithubIds.push(user?.id);
      }
    }
    // if there are no contributors tagged, we award GitPOAP(s) to the PR/issue creator
    if (contributorGithubIds.length === 0) {
      contributorGithubIds.push(issueCreatorId);
    }
    // create claims for these contributors via API endpoint
    const octokit = await app.auth(); // Not passing an id returns a JWT-authenticated client
    const jwt = (await octokit.auth({ type: 'app' })) as { token: string };

    const data = isPR
      ? {
          pullRequest: {
            organization,
            repo,
            pullRequestNumber: issueNumber,
            contributorGithubIds,
            wasEarnedByMention: true,
          },
        }
      : {
          issue: {
            organization,
            repo,
            issueNumber,
            contributorGithubIds,
            wasEarnedByMention: true,
          },
        };

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
