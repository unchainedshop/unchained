import startAPI from 'meteor/unchained:api';
import interceptEmails from './intercept-emails';
import setupAccounts, { buildContext } from './setup-accounts';
import setupWorkqueue, { workerTypeDefs } from './setup-workqueue';
import setupDatabase from './setup-db';
import setupTemplates, { MessageTypes } from './setup-templates';

export { buildContext, MessageTypes };

const {
  NODE_ENV,
  UNCHAINED_DISABLE_EMAIL_INTERCEPTION = false,
  UNCHAINED_DISABLE_WORKER = false,
} = process.env;

const isWorkQueueEnabled = (options) => {
  if (options?.disableWorker) return false;
  return !UNCHAINED_DISABLE_WORKER;
};

const isEmailInterceptionEnabled = (options) => {
  if (options?.disableEmailInterception) return false;
  return NODE_ENV !== 'production' && !UNCHAINED_DISABLE_EMAIL_INTERCEPTION;
};

export const queueWorkers = [];

export const startPlatform = ({ modules, typeDefs, ...options } = {}) => {
  setupDatabase({ modules, ...options });
  setupAccounts(options);
  setupTemplates(options);
  startAPI({
    ...options,
    typeDefs: [...workerTypeDefs(), ...(typeDefs || [])],
  });
  if (isEmailInterceptionEnabled(options)) interceptEmails(options);
  if (isWorkQueueEnabled(options)) {
    const handlers = setupWorkqueue({
      cronText:
        NODE_ENV !== 'production' ? 'every 2 seconds' : 'every 30 seconds',
      ...options,
    });
    handlers.forEach((handler) => queueWorkers.push(handler));
  }
};
