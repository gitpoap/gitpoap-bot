// You can import your modules
// import index from '../src/index'

import nock from 'nock';
// Requiring our app implementation
import myProbotApp from '../src/bot';
import { Probot, ProbotOctokit } from 'probot';
// Requiring our fixtures
import issueCommentPayload from './fixtures/issue_comment.created_issue.json';
import prCommentPayload from './fixtures/issue_comment.created_pr.json';
import nonOwnerPayload from './fixtures/issue_comment.created_non_owner.json';
import prClosedPayload from './fixtures/pull_request.closed.json';
import nonMergedPrClosedPayload from './fixtures/pull_request.closed_non_merged.json';
import { generateIssueComment, generateComment } from '../src/comments';
const fs = require('fs');
const path = require('path');

const privateKey = fs.readFileSync(path.join(__dirname, 'fixtures/mock-cert.pem'), 'utf-8');

const newClaims = [
  {
    id: 1,
    user: { githubHandle: 'test1' },
    gitPOAP: {
      id: 15,
      name: 'GitPOAP: 2022 gitpoap-bot-test-repo Contributor',
      imageUrl: 'https://assets.poap.xyz/2022-wagyu-installer-contributor-2022-logo-1649213116205.png',
      description: 'You contributed at least one merged pull request to the Wagyu Installer project in 2022.  Your contributions are greatly valued.',
      threshold: 1
    }
  },
  {
    id: 2,
    user: { githubHandle: 'test2' },
    gitPOAP: {
      id: 16,
      name: 'GitPOAP: 2022 gitpoap-bot-test-repo Contributor',
      imageUrl: 'https://assets.poap.xyz/2022-wagyu-installer-contributor-2022-logo-1649213116205.png',
      description: 'You contributed at least one merged pull request to the Wagyu Installer project in 2022.  Your contributions are greatly valued.',
      threshold: 1
    }
  },
  {
    id: 3,
    user: { githubHandle: 'test3' },
    gitPOAP: {
      id: 17,
      name: 'GitPOAP: 2022 gitpoap-bot-test-repo Contributor',
      imageUrl: 'https://assets.poap.xyz/2022-wagyu-installer-contributor-2022-logo-1649213116205.png',
      description: 'You contributed at least one merged pull request to the Wagyu Installer project in 2022.  Your contributions are greatly valued.',
      threshold: 1
    }
  }
];
const issueCreatedBody = { body: generateIssueComment(newClaims) };
const prClosedIssueCommentBody = { body: generateComment(newClaims) };

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

  describe("Issue Comment", async function() {
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
  
        // get github login ids
        .get('/users/test1')
        .reply(200, {
          "id": 1,
        })
        .get('/users/test2')
        .reply(200, {
          "id": 2,
        })
        .get('/users/test3')
        .reply(200, {
          "id": 3,
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
      await probot.receive({ name: 'issue_comment', payload: issueCommentPayload });
  
      expect(githubAPIMock.activeMocks()).toStrictEqual([]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
    });
  
    it('should create a comment on the PR if repo owner tagged gitpoap-bot and contributors on an PR comment', async (done) => {
      const githubAPIMock = nock('https://api.github.com')
        // Test that we correctly return a test token
        .post('/app/installations/29153052/access_tokens')
        .reply(200, {
          token: 'test',
          permissions: {
            issues: 'write',
          },
        })
  
        // get github login ids
        .get('/users/test1')
        .reply(200, {
          "id": 1,
        })
        .get('/users/test2')
        .reply(200, {
          "id": 2,
        })
        .get('/users/test3')
        .reply(200, {
          "id": 3,
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
      await probot.receive({ name: 'issue_comment', payload: prCommentPayload });
  
      expect(githubAPIMock.activeMocks()).toStrictEqual([]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
    });
  
    it('should not do anything if non repo owner tagged gitpoap-bot and contributors on an issue comment', async () => {
      const githubAPIMock = nock('https://api.github.com')
        // Test that we correctly return a test token
        .post('/app/installations/29153052/access_tokens')
        .reply(200, {
          token: 'test',
          permissions: {
            issues: 'write',
          },
        })
  
        // get github login ids
        .get('/users/test1')
        .reply(200, {
          "id": 1,
        })
        .get('/users/test2')
        .reply(200, {
          "id": 2,
        })
        .get('/users/test3')
        .reply(200, {
          "id": 3,
        })
  
        // Test that a comment is posted
        .post('/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments')
        .reply(200);
  
      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`)
        .reply(200, {
          newClaims
        });
  
      // Receive a webhook event
      await probot.receive({ name: 'issue_comment', payload: nonOwnerPayload });
  
      expect(githubAPIMock.activeMocks()).toStrictEqual([
        "POST https://api.github.com:443/app/installations/29153052/access_tokens",
        "GET https://api.github.com:443/users/test1",
        "GET https://api.github.com:443/users/test2",
        "GET https://api.github.com:443/users/test3",
        "POST https://api.github.com:443/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments",
      ]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([`POST ${process.env.API_URL}/claims/gitpoap-bot/create`]);
    });
  
    it('should not create a comment on the PR if no claims are claimed', async () => {
      const githubAPIMock = nock('https://api.github.com')
        // Test that we correctly return a test token
        .post('/app/installations/29153052/access_tokens')
        .reply(200, {
          token: 'test',
          permissions: {
            issues: 'write',
          },
        })
  
        // get github login ids
        .get('/users/test1')
        .reply(200, {
          "id": 1,
        })
        .get('/users/test2')
        .reply(200, {
          "id": 2,
        })
        .get('/users/test3')
        .reply(200, {
          "id": 3,
        })
  
        // Test that a comment is posted
        .post('/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments')
        .reply(200);
  
      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`)
        .reply(200, {
          newClaims: []
        });
  
      // Receive a webhook event
      await probot.receive({ name: 'issue_comment', payload: prCommentPayload });
  
      expect(githubAPIMock.activeMocks()).toStrictEqual(["POST https://api.github.com:443/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments"]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
    });  
  })

  describe("PR Close", async function(){
    it('should create a comment on the PR if PR is closed with merge', async (done) => {
      const githubAPIMock = nock('https://api.github.com')
        // Test that we correctly return a test token
        .post('/app/installations/29153052/access_tokens')
        .reply(200, {
          token: 'test',
          permissions: {
            issues: 'write',
          },
        })
  
        // Test that a comment is posted
        .post('/repos/Codertocat/Hello-World/issues/2/comments', (body: any) => {
          done(expect(body).toMatchObject(prClosedIssueCommentBody));
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
      await probot.receive({ name: 'pull_request', payload: prClosedPayload });
  
      expect(githubAPIMock.activeMocks()).toStrictEqual([]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
    });

    it('should not create a comment on the PR if there are no new claims from API', async () => {
      const githubAPIMock = nock('https://api.github.com')
        // Test that we correctly return a test token
        .post('/app/installations/29153052/access_tokens')
        .reply(200, {
          token: 'test',
          permissions: {
            issues: 'write',
          },
        })
  
        // Test that a comment is posted
        .post('/repos/Codertocat/Hello-World/issues/2/comments')
        .reply(200);
  
      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`)
        .reply(200, {
          newClaims: []
        });
  
      // Receive a webhook event
      await probot.receive({ name: 'pull_request', payload: prClosedPayload });
  
      expect(githubAPIMock.activeMocks()).toStrictEqual([
        "POST https://api.github.com:443/app/installations/29153052/access_tokens",
        "POST https://api.github.com:443/repos/Codertocat/Hello-World/issues/2/comments"
      ]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
    });

    it('should not do anything if PR is closed without merge', async () => {
      const githubAPIMock = nock('https://api.github.com')
        // Test that we correctly return a test token
        .post('/app/installations/29153052/access_tokens')
        .reply(200, {
          token: 'test',
          permissions: {
            issues: 'write',
          },
        })
  
        // Test that a comment is posted
        .post('/repos/Codertocat/Hello-World/issues/2/comments')
        .reply(200);
  
      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`)
        .reply(200, {
          newClaims: []
        });
  
      // Receive a webhook event
      await probot.receive({ name: 'pull_request', payload: nonMergedPrClosedPayload });
  
      expect(githubAPIMock.activeMocks()).toStrictEqual([
        "POST https://api.github.com:443/app/installations/29153052/access_tokens",
        "POST https://api.github.com:443/repos/Codertocat/Hello-World/issues/2/comments"
      ]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([`POST ${process.env.API_URL}/claims/gitpoap-bot/create`]);
    });
  })

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
