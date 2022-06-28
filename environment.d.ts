declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      WEBHOOK_PROXY_URL: string;
      APP_ID: string;
      PRIVATE_KEY: string;
      WEBHOOK_SECRET: string;
      GITHUB_CLIENT_ID: string;
      GITHUB_CLIENT_SECRET: string;
      API_URL: string;
      SENTRY_DSN: string;
    }
  }
}

export {};
