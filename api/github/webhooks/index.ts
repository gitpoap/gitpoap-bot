import { createNodeMiddleware, createProbot } from 'probot';
import app from '../../../src/bot';

module.exports = createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: '/api/github/webhooks',
});
