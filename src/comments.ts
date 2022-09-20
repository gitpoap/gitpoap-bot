// Should be the same as in gitpoap-backend/src/routes/claims.ts

type GitPOAP = {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
  threshold: number;
};

type BotClaimData = {
  id: number;
  gitPOAP: GitPOAP;
  user: { githubHandle: string };
};

type GitPOAPWithRecipients = GitPOAP & {
  recipients: string[];
};

type GitPOAPWithRecipientsMap = Record<number, GitPOAPWithRecipients>;

export function generateComment(claims: BotClaimData[]): string {
  let qualifier: string;
  if (claims.length > 1) {
    qualifier = `some GitPOAPs`;
  } else {
    qualifier = `a GitPOAP`;
  }

  let comment = `Woohoo, your important contribution to this open-source project has earned you ${qualifier}!\n`;

  for (const claim of claims) {
    if (claim.gitPOAP.id && claim.gitPOAP.name && claim.gitPOAP.imageUrl) {
      comment += `
[**${claim.gitPOAP.name}**](https://www.gitpoap.io/gp/${claim.gitPOAP.id}):
<img alt="${claim.gitPOAP.name} GitPOAP Badge" src="${claim.gitPOAP.imageUrl}" height="200px">`;
    }
  }

  comment +=
    '\n\nHead on over to [GitPOAP.io](https://www.gitpoap.io) and connect your GitHub account to mint!';

  return comment;
}

export function generateIssueComment(claims: BotClaimData[]): string {
  let claimData: GitPOAPWithRecipientsMap = {};
  let comment = '';
  // arrange claims by its id
  for (let claim of claims) {
    const recievers = claimData[claim.gitPOAP.id] ? claimData[claim.gitPOAP.id].recipients : [];
    claimData[claim.gitPOAP.id] = {
      ...claim.gitPOAP,
      recipients: [...recievers, claim.user.githubHandle],
    };
  }
  // generate a comment body
  for (const gitPoapId in claimData) {
    const claim = claimData[gitPoapId];
    const recipients = claim.recipients;
    const uniquerecipients = Array.from(new Set(recipients));
    const recipientsTag = uniquerecipients.reduce((acc, recipient) => acc + `@${recipient} `, '');
    comment += `Congrats, ${recipientsTag}! You've earned a GitPOAP below for your contribution!`;

    if (claim.id && claim.name && claim.imageUrl) {
      comment += `
[**${claim.name}**](https://www.gitpoap.io/gp/${claim.id}):
<img alt="${claim.name} GitPOAP Badge" src="${claim.imageUrl}" height="200px">\n\n`;
    }
  }
  comment +=
    '\n\nHead on over to [GitPOAP.io](https://www.gitpoap.io) and connect your GitHub account to mint if you haven’t already!';

  return comment;
}
