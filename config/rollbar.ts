import Rollbar from 'rollbar';

const rollbarClient = new Rollbar({
  // https://rollbar.com/docs/notifier/rollbar.js/#configuration-reference
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  // Enable rollbar on staging and production
  enabled: ['staging', 'production'].includes(process.env.ENVIRONMENT ?? ''),
  payload: {
    environment: process.env.ENVIRONMENT,
  },
});

export const rollbar = {
  error: (...args: Rollbar.LogArgument[]) =>
    new Promise((resolve) => rollbarClient.error(...args, resolve)),
};
