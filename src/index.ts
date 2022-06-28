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

export = (app: Probot) => {
  /* Eventually turn into pull_request.merged */
  app.on('pull_request.reopened', async (context: Context) => {
    // const auth = await context.octokit.auth();

    // console.log(app)
    console.log('IN THE REPOPENED HANDLER');
    // const auth = await context.octokit.auth();
    const github = await app.auth(); // Not passing an id returns a JWT-authenticated client
    const tokenData = await github.apps.createInstallationAccessToken({
      installation_id: context.payload.installation.id,
    });

    const token = tokenData.data.token;
    console.log(token);

    const repo = context.payload.repository.full_name;
    const owner = context.payload.repository.owner.login;
    const pullRequestNum = context.payload.pull_request.number;

    const res = await fetch(`${process.env.API_URL}/claims/gitpoap-bot/create`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        repo,
        owner,
        pullRequestNum,
      }),
    });

    if (res.status !== 400) {
      context.log.info('Issue occurred');
    }

    if (res.status === 409) {
      context.log.info('Claim already exists');
    }

    context.log.info('PR HAS BEEN REOPENED');
    if (res.status === 200) {
      context.log.info('Claim created successfully - post comment on PR');
      const issueComment = context.issue({
        body: `Thanks for opening PR #${pullRequestNum}!`,
      });
      await context.octokit.issues.createComment(issueComment);
    }
  });

  app.on('pull_request.closed', async (context) => {
    const pullRequestNum = context.payload.pull_request.number;
    const issueComment = context.issue({
      body: `Thanks for REOPENING PR #${pullRequestNum}!`,
    });

    context.log.info(context.payload.repository.owner);

    context.log.info('PR HAS BEEN CLOSED');
    await context.octokit.issues.createComment(issueComment);
  });
};
