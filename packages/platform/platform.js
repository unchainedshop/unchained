import startAPI from 'meteor/unchained:api';
import interceptEmails from './intercept-emails';
import setupAccounts, {
  configureAccountsEmailTemplates,
  buildContext,
} from './setup-accounts';

export * from './setup-db';
export * from './setup-cron';
export { configureAccountsEmailTemplates, buildContext };

const { NODE_ENV, UNCHAINED_DISABLE_EMAIL_INTERCEPTION } = process.env;

export const startPlatform = (options = {}) => {
  setupAccounts(options);
  startAPI(options);
  if (
    NODE_ENV !== 'production' &&
    !options.disableEmailInterception &&
    !UNCHAINED_DISABLE_EMAIL_INTERCEPTION
  ) {
    interceptEmails();
  }
};
