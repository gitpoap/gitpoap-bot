// You can import your modules
// import index from '../src/index'

import nock from 'nock';
// Requiring our app implementation
import myProbotApp from '../src/bot';
import { Probot, ProbotOctokit } from 'probot';
// Requiring our fixtures
import payload from './fixtures/issue_comment.created.json';
import { generateIssueComment } from '../src/comments';
const fs = require('fs');
const path = require('path');

const privateKey = fs.readFileSync(path.join(__dirname, 'fixtures/mock-cert.pem'), 'utf-8');
const newClaims = [
  {
    id: 56,
    user: { githubHandle: 'test' },
    gitPOAP: {
      id: 15,
      name: 'GitPOAP: 2022 gitpoap-bot-test-repo Contributor',
      imageUrl: 'https://assets.poap.xyz/2022-wagyu-installer-contributor-2022-logo-1649213116205.png',
      description: 'You contributed at least one merged pull request to the Wagyu Installer project in 2022.  Your contributions are greatly valued.',
      threshold: 1
    }
  }
];
const issueCreatedBody = { body: generateIssueComment(newClaims) };

describe('gitpoap-bot', () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 236807,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  it('should create a comment on the issue if repo owner tagged gitpoap-bot and contributors on an issue comment', async (done) => {
    const githubAPIMock = nock('https://api.github.com')
      // Test that we correctly return a test token
      .post('/app/installations/29153052/access_tokens')
      .reply(200, {
        token: 'test',
        permissions: {
          issues: 'write',
        },
      })

      // get github login id
      .get('/users/test')
      .reply(200, {
        "id": 383316,
      })

      // Test that a comment is posted
      .post('/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments', (body: any) => {
        done(expect(body).toMatchObject(issueCreatedBody));
        return true;
      })
      .reply(200);

    // Test response from gitpoap api
    const gitpoapAPIMock = nock(`${process.env.API_URL}`)
      .post(`/claims/gitpoap-bot/create`)
      .reply(200, {
        newClaims
      });

    // Receive a webhook event
    await probot.receive({ name: 'issue_comment', payload });

    expect(githubAPIMock.activeMocks()).toStrictEqual([]);
    expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about using TypeScript in your tests, Jest recommends:
// https://github.com/kulshekhar/ts-jest

// For more information about testing with Nock see:
// https://github.com/nock/nock
