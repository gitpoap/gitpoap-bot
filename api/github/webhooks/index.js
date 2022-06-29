const { createNodeMiddleware, createProbot } = require("probot");

const app = require("../../../lib/bot");

module.exports = createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: '/api/github/webhooks'
});
