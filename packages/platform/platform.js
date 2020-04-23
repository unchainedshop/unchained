import startAPI from 'meteor/unchained:api';
import interceptEmails from './intercept-emails';
import setupAccounts, {
  configureAccountsEmailTemplates,
  buildContext,
} from './setup-accounts';
import setupWorkqueue, { workerTypeDefs } from './setup-workqueue';
import setupDatabase, { createFixtures } from './setup-db';

export { configureAccountsEmailTemplates, buildContext, createFixtures };

const {
  NODE_ENV,
  UNCHAINED_DISABLE_EMAIL_INTERCEPTION,
  UNCHAINED_DISABLE_WORKER,
} = process.env;

const isWorkQueueEnabled = (options) => {
  if (options?.disableWorker) return false;
  return NODE_ENV !== 'production' && !UNCHAINED_DISABLE_WORKER;
};

const isEmailInterceptionEnabled = (options) => {
  if (options?.disableEmailInterception) return false;
  return NODE_ENV !== 'production' && !UNCHAINED_DISABLE_EMAIL_INTERCEPTION;
};

export const queueWorkers = [];

export const startPlatform = (options = {}) => {
  setupDatabase(options);
  setupAccounts(options);
  startAPI({
    options,
    typeDefs: [...workerTypeDefs(), ...(options?.typeDefs || [])],
  });
  if (isEmailInterceptionEnabled(options)) interceptEmails(options);
  if (isWorkQueueEnabled(options)) {
    const handlers = setupWorkqueue({
      cronText:
        NODE_ENV !== 'production' ? 'every 2 seconds' : 'every 5 seconds',
      ...options,
    });
    handlers.forEach((handler) => queueWorkers.push(handler));
  }
};
