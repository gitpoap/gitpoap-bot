import { WebClient } from '@slack/web-api';

const slackClient = new WebClient(process.env.SLACK_TOKEN);

const IS_PROD = process.env.NODE_ENV === 'production';

type SlackOrgs = 'gitpoap';

type SlackChannels = {
  [org in SlackOrgs]: Record<string, string>;
};

const CHANNELS: SlackChannels = {
  gitpoap: {
    alerts: 'C049AGT4BHN',
    devAlerts: 'C049XUFTQ5B',
  },
};

const sendSlackMessage = async (message: string) => {
  const channel = IS_PROD ? CHANNELS.gitpoap.alerts : CHANNELS.gitpoap.devAlerts;
  try {
    console.debug(`Sending slack message to channel: ${channel}`);
    await slackClient.chat.postMessage({
      channel,
      text: message,
    });
  } catch (e) {
    console.error(`${e}`);
  }
};

export const sendBotMentionedMessage = (
  comment: string,
  sender: string,
  htmlURL: string,
  repo: string,
) => {
  const msg = `:robot_face: @gitpoap-bot was mentioned in the <${htmlURL}|${repo}> repository.
    * Sender: <https://github.com/${sender}|@${sender}>
    * Comment: "${comment}"`;

  sendSlackMessage(msg);
};
