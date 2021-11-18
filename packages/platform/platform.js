import startAPI from 'meteor/unchained:api';
import { initDb } from 'meteor/unchained:mongodb';
import { initCore } from 'meteor/unchained:core';
import interceptEmails from './intercept-emails';
import setupAccounts from './setup-accounts';
import setupWorkqueue, { workerTypeDefs } from './setup-workqueue';
import migrationRepository from './migrations/migrationRepository';
import runMigrations from './migrations/runMigrations';
import setupTemplates, { MessageTypes } from './setup-templates';
import './worker/bulk-import';
import setupCarts from './setup-carts';
import { BulkImportPayloads } from './bulk-importer';
import generateEventTypeDefs from './generate-registered-events';

export { MessageTypes };

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

export const startPlatform = async ({ modules, typeDefs, ...options } = {}) => {
  const workQueueIsEnabled = isWorkQueueEnabled(options);
  const emailInterceptionIsEnabled = isEmailInterceptionEnabled(options);

  // Configure database
  const db = initDb();
  
  // Initialise core using the database
  const unchained = await initCore({
    db,
    modules,
    bulkImporter: {
      BulkImportPayloads,
    },
    migrationRepository,
    options,
  });

  if (workQueueIsEnabled) {
    await runMigrations(migrationRepository);
  }

  setupAccounts(options);
  setupTemplates(options);
  startAPI({
    ...options,
    typeDefs: [
      ...generateEventTypeDefs(),
      ...workerTypeDefs(),
      ...(typeDefs || []),
    ],
    unchained,
  });
  if (emailInterceptionIsEnabled) interceptEmails(options);
  if (workQueueIsEnabled) {
    const handlers = setupWorkqueue(options);
    handlers.forEach((handler) => queueWorkers.push(handler));
    await setupCarts(options);
  }
};
