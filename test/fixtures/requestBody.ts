export const newIssueClaims_requestBody = {
  issue: {
    organization: 'gitpoap',
    repo: 'gitpoap-bot-test-repo',
    issueNumber: 25,
    contributorGithubIds: [1, 2, 3],
    wasEarnedByMention: true,
  },
};

export const newPRClaims_requestBody = {
  pullRequest: {
    organization: 'gitpoap',
    repo: 'gitpoap-bot-test-repo',
    pullRequestNumber: 25,
    contributorGithubIds: [1, 3],
    wasEarnedByMention: true,
  },
};

export const newClaimsWithoutOrgs_requestBody = {
  issue: {
    organization: 'gitpoap',
    repo: 'gitpoap-bot-test-repo',
    issueNumber: 25,
    contributorGithubIds: [2],
    wasEarnedByMention: true,
  },
};
