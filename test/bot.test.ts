import { Probot, ProbotOctokit } from 'probot';
import nock from 'nock';
const fs = require('fs');
const path = require('path');
// Requiring our app implementation
import myProbotApp from '../src/bot';
// Requiring our fixtures
import issueCommentPayload from './fixtures/issue_comment.created_issue.json';
import issueCommentNoUsersPayload from './fixtures/issue_comment.created_issue_no_user.json';
import prCommentPayload from './fixtures/issue_comment.created_pr.json';
import nonOwnerPayload from './fixtures/issue_comment.created_non_owner.json';
import prClosedPayload from './fixtures/pull_request.closed.json';
import nonMergedPrClosedPayload from './fixtures/pull_request.closed_non_merged.json';
import { generateIssueComment, generateComment } from '../src/utils';
import { newClaims, newClaimsWithoutOrgs } from './fixtures/claims';
import {
  newIssueClaims_requestBody,
  newPRClaims_requestBody,
  newClaimsWithoutOrgs_requestBody,
} from './fixtures/requestBody';

const privateKey = fs.readFileSync(path.join(__dirname, 'fixtures/mock-cert.pem'), 'utf-8');
const issueCreatedBody = { body: generateIssueComment(newClaims) };
const prClosedIssueCommentBody = { body: generateComment(newClaims) };
const issueCreatedBodyWithoutOrgs = { body: generateIssueComment(newClaimsWithoutOrgs) };

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

  describe('Issue Comment', () => {
    it('should create a comment on the issue if repo owner tagged gitpoap-bot and contributors on an issue comment', async () => {
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
          id: 1,
          type: 'User',
        })
        .get('/users/test2')
        .reply(200, {
          id: 2,
          type: 'User',
        })
        .get('/users/test3')
        .reply(200, {
          id: 3,
          type: 'User',
        })

        // get permissions
        .get('/repos/gitpoap/gitpoap-bot-test-repo/collaborators/gitpoap/permission')
        .reply(200, {
          user: {
            permissions: {
              admin: true,
            },
          },
        })

        // Test that a comment is posted with the correct body
        .post('/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments', issueCreatedBody)
        .reply(200);

      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`, newIssueClaims_requestBody)
        .reply(200, {
          newClaims,
        });

      // Receive a webhook event
      await probot.receive({ name: 'issue_comment', payload: issueCommentPayload });

      expect(githubAPIMock.activeMocks()).toStrictEqual([]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
    });

    it('should create a comment on the PR if repo owner tagged gitpoap-bot and contributors on an PR comment', async () => {
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
          id: 1,
          type: 'User',
        })
        .get('/users/test2')
        .reply(200, {
          id: 2,
        })
        .get('/users/test3')
        .reply(200, {
          id: 3,
          type: 'User',
        })

        // get permissions
        .get('/repos/gitpoap/gitpoap-bot-test-repo/collaborators/gitpoap/permission')
        .reply(200, {
          user: {
            permissions: {
              admin: true,
            },
          },
        })

        // Test that a comment is posted with the correct body
        .post('/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments', issueCreatedBody)
        .reply(200);

      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`, newPRClaims_requestBody)
        .reply(200, {
          newClaims,
        });

      // Receive a webhook event
      await probot.receive({ name: 'issue_comment', payload: prCommentPayload });

      expect(githubAPIMock.activeMocks()).toStrictEqual([]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
    });

    it('should not do anything if non maintainer tagged gitpoap-bot and contributors on an issue comment', async () => {
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
          id: 1,
          type: 'User',
        })
        .get('/users/test2')
        .reply(200, {
          id: 2,
        })
        .get('/users/test3')
        .reply(200, {
          id: 3,
          type: 'User',
        })

        // get permissions
        .get('/repos/gitpoap/gitpoap-bot-test-repo/collaborators/tyler415git/permission')
        .reply(200, {
          user: {
            permissions: {
              admin: false,
              maintain: false,
              push: false,
            },
          },
        })

        // Test that a comment is posted
        .post('/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments')
        .reply(200);

      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`)
        .reply(200, {
          newClaims,
        });

      // Receive a webhook event
      await probot.receive({ name: 'issue_comment', payload: nonOwnerPayload });

      expect(githubAPIMock.activeMocks()).toStrictEqual([
        'GET https://api.github.com:443/users/test1',
        'GET https://api.github.com:443/users/test2',
        'GET https://api.github.com:443/users/test3',
        'POST https://api.github.com:443/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments',
      ]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([
        `POST ${process.env.API_URL}/claims/gitpoap-bot/create`,
      ]);
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
          id: 1,
          type: 'User',
        })
        .get('/users/test2')
        .reply(200, {
          id: 2,
          type: 'User',
        })
        .get('/users/test3')
        .reply(200, {
          id: 3,
          type: 'User',
        })

        // get permissions
        .get('/repos/gitpoap/gitpoap-bot-test-repo/collaborators/gitpoap/permission')
        .reply(200, {
          user: {
            permissions: {
              admin: true,
            },
          },
        })

        // Test that a comment is posted
        .post('/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments')
        .reply(200);

      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`)
        .reply(200, {
          newClaims: [],
        });

      // Receive a webhook event
      await probot.receive({ name: 'issue_comment', payload: prCommentPayload });

      expect(githubAPIMock.activeMocks()).toStrictEqual([
        'POST https://api.github.com:443/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments',
      ]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
    });

    it('should not create a comment on the issue if repo owner tagged gitpoap-bot with no contributors tagged', async () => {
      const githubAPIMock = nock('https://api.github.com')
        // Test that we correctly return a test token
        .post('/app/installations/29153052/access_tokens')
        .reply(200, {
          token: 'test',
          permissions: {
            issues: 'write',
          },
        });

      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`)
        .reply(200, {
          newClaims,
        });

      // Receive a webhook event
      await probot.receive({ name: 'issue_comment', payload: issueCommentNoUsersPayload });

      expect(githubAPIMock.activeMocks()).toStrictEqual([
        'POST https://api.github.com:443/app/installations/29153052/access_tokens',
      ]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([
        `POST ${process.env.API_URL}/claims/gitpoap-bot/create`,
      ]);
    });

    it('should create claims for only users', async () => {
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
          id: 1,
          type: 'Organization',
        })
        .get('/users/test2')
        .reply(200, {
          id: 2,
          type: 'User',
        })
        .get('/users/test3')
        .reply(200, {
          id: 3,
          type: 'Organization',
        })

        // get permissions
        .get('/repos/gitpoap/gitpoap-bot-test-repo/collaborators/gitpoap/permission')
        .reply(200, {
          user: {
            permissions: {
              admin: true,
            },
          },
        })

        // Test that a comment is posted with the correct body
        .post(
          '/repos/gitpoap/gitpoap-bot-test-repo/issues/25/comments',
          issueCreatedBodyWithoutOrgs,
        )
        .reply(200);

      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`, newClaimsWithoutOrgs_requestBody)
        .reply(200, {
          newClaims: newClaimsWithoutOrgs,
        });

      // Receive a webhook event
      await probot.receive({ name: 'issue_comment', payload: issueCommentPayload });

      expect(githubAPIMock.activeMocks()).toStrictEqual([]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([]);
    });
  });

  describe('PR Close', () => {
    it('should create a comment on the PR if PR is closed with merge', async () => {
      const githubAPIMock = nock('https://api.github.com')
        // Test that we correctly return a test token
        .post('/app/installations/29153052/access_tokens')
        .reply(200, {
          token: 'test',
          permissions: {
            issues: 'write',
          },
        })

        // Test that a comment is posted with the correct body
        .post('/repos/Codertocat/Hello-World/issues/2/comments', prClosedIssueCommentBody)
        .reply(200);

      // Test response from gitpoap api
      const gitpoapAPIMock = nock(`${process.env.API_URL}`)
        .post(`/claims/gitpoap-bot/create`)
        .reply(200, {
          newClaims,
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
          newClaims: [],
        });

      // Receive a webhook event
      await probot.receive({ name: 'pull_request', payload: prClosedPayload });

      expect(githubAPIMock.activeMocks()).toStrictEqual([
        'POST https://api.github.com:443/app/installations/29153052/access_tokens',
        'POST https://api.github.com:443/repos/Codertocat/Hello-World/issues/2/comments',
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
          newClaims: [],
        });

      // Receive a webhook event
      await probot.receive({ name: 'pull_request', payload: nonMergedPrClosedPayload });

      expect(githubAPIMock.activeMocks()).toStrictEqual([
        'POST https://api.github.com:443/app/installations/29153052/access_tokens',
        'POST https://api.github.com:443/repos/Codertocat/Hello-World/issues/2/comments',
      ]);
      expect(gitpoapAPIMock.activeMocks()).toStrictEqual([
        `POST ${process.env.API_URL}/claims/gitpoap-bot/create`,
      ]);
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
