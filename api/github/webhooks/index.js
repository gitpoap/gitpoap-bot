const { createNodeMiddleware, createProbot } = require("probot");

const app = require("../../../bot");

module.exports = createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: '/api/github/webhooks'
});
