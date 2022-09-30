import { Context } from 'probot';
import issueParser, { Mention } from 'issue-parser';

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

export type CommentParseResult = {
  mentions: ReadonlyArray<Mention>;
  userMentions: string[];
  invalidUserMentions: string[];
  organizations: string[];
  validUserMentions: string[];
  contributorIds: number[];
  isBotMentioned: boolean;
};

const addLearnMore = (comment: string): string =>
  comment + `\n\nLearn more about GitPOAPs [here](https://docs.gitpoap.io/).`;

const addHeadOverToGitPOAP = (comment: string): string =>
  comment +
  `\n\nHead to [gitpoap.io](https://www.gitpoap.io) & connect your GitHub account to mint!`;

export function generateComment(claims: BotClaimData[]): string {
  let qualifier: string;
  if (claims.length > 1) {
    qualifier = `some GitPOAPs`;
  } else {
    qualifier = `a GitPOAP`;
  }

  let comment = `Congrats, your important contribution to this open-source project has earned you ${qualifier}!\n\n`;

  for (const claim of claims) {
    if (claim.gitPOAP.id && claim.gitPOAP.name && claim.gitPOAP.imageUrl) {
      comment += `
[**${claim.gitPOAP.name}**](https://www.gitpoap.io/gp/${claim.gitPOAP.id}):\n

<img alt="${claim.gitPOAP.name} GitPOAP Badge" src="${claim.gitPOAP.imageUrl}" height="200px">\n`;
    }
  }

  comment = addHeadOverToGitPOAP(comment);
  comment = addLearnMore(comment);

  return comment;
}

export function generateIssueComment(claims: BotClaimData[]): string {
  let gitPOAPsMap: GitPOAPWithRecipientsMap = {};
  let comment = '';
  // arrange claims by its id
  for (let claim of claims) {
    const recipients = gitPOAPsMap[claim.gitPOAP.id]
      ? gitPOAPsMap[claim.gitPOAP.id].recipients
      : [];
    gitPOAPsMap[claim.gitPOAP.id] = {
      ...claim.gitPOAP,
      recipients: [...recipients, claim.user.githubHandle],
    };
  }
  // generate a comment body
  for (const gitPoapId in gitPOAPsMap) {
    const gitPOAP = gitPOAPsMap[gitPoapId];
    const recipients = gitPOAP.recipients;
    const uniqueRecipients = Array.from(new Set(recipients));
    const recipientsTag = uniqueRecipients.reduce((acc, recipient) => acc + `@${recipient} `, '');
    comment += `Congrats, ${recipientsTag}! You've earned a GitPOAP below for your contribution!\n\n`;

    if (gitPOAP.id && gitPOAP.name && gitPOAP.imageUrl) {
      comment += `
[**${gitPOAP.name}**](https://www.gitpoap.io/gp/${gitPOAP.id}):\n

<img alt="${gitPOAP.name} GitPOAP Badge" src="${gitPOAP.imageUrl}" height="200px">\n`;
    }
  }

  comment = addHeadOverToGitPOAP(comment);
  comment = addLearnMore(comment);

  return comment;
}

export const parseComment = async (
  comment: string,
  context: Context<'issue_comment.created'>,
): Promise<CommentParseResult> => {
  // parse comment using `issue-parser`
  const parse = issueParser('github');
  const parseResult = parse(comment);
  const mentions: ReadonlyArray<Mention> = parseResult.mentions;
  const usernames: string[] = mentions.map((mention: Mention) => mention.user);
  // check if gitpoap-bot is mentioned
  const isBotMentioned = usernames.some((username: string) => username === 'gitpoap-bot');
  // filter user mentions
  const userMentions: string[] = usernames.filter((username) => username !== 'gitpoap-bot');
  // filter valid user mentions, not organization
  const validUserMentions: string[] = [];
  const contributorIds: number[] = [];
  const invalidUserMentions: string[] = [];
  const organizations: string[] = [];
  for (let username of userMentions) {
    try {
      const res = await context.octokit.users.getByUsername({
        username,
      });
      const user = res.data;
      // we give GitPOAPs to only users, not orgnizations
      if (user && user.id) {
        if (user.type === 'User') {
          validUserMentions.push(username);
          contributorIds.push(user?.id);
        } else if (user.type === 'Organization') {
          organizations.push(username);
        }
      } else {
        invalidUserMentions.push(username);
      }
    } catch (err) {
      console.log('err', err);
    }
  }

  return {
    mentions,
    isBotMentioned,
    userMentions,
    validUserMentions,
    contributorIds,
    invalidUserMentions,
    organizations,
  };
};
