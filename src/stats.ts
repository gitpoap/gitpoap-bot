import { App } from 'octokit';

const PER_PAGE = 100;

function getApp() {
  return new App({
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
  });
}

export async function getBotInstalls() {
  const app = getApp();

  let results = [];

  let page = 1;
  for (let count = PER_PAGE; count === PER_PAGE; ++page) {
    const { data: installations } = await app.octokit.rest.apps.listInstallations({
      page,
      per_page: PER_PAGE,
    });
    count = installations.length;
    results = results.concat(installations.map(i => i.account.html_url));
  }

  return results;
}
