import { createNodeMiddleware, createProbot } from 'probot';
import app from '../../../bot';

export default createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: '/api/github/webhooks',
});
