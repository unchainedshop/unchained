import startAPI from 'meteor/unchained:api';
import interceptEmails from './intercept-emails';

export * from './setup-db';
export * from './setup-accounts';
export * from './setup-cron';

const { NODE_ENV, UNCHAINED_DISABLE_EMAIL_INTERCEPTION } = process.env;

export const startPlatform = (options = {}) => {
  startAPI(options);
  if (
    NODE_ENV !== 'production' &&
    !options.disableEmailInterception &&
    !UNCHAINED_DISABLE_EMAIL_INTERCEPTION
  ) {
    interceptEmails();
  }
};
