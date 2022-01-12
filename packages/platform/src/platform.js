import { startAPIServer } from 'meteor/unchained:api';
import { initCore } from 'meteor/unchained:core';
import { initDb } from 'meteor/unchained:mongodb';
// import { setupTemplates, MessageTypes } from '../setup-templates';
import { setupWorkqueue, workerTypeDefs } from './setup/setupWorkqueue';
import { setupCarts } from './setup/setupCarts';
import { BulkImportPayloads } from './bulk-importer/createBulkImporter';
import { generateEventTypeDefs } from './generateRegisteredEvents';
import { interceptEmails } from './interceptEmails';
import { migrationRepository } from './migrations/migrationRepository';
import { runMigrations } from './migrations/runMigrations';
import { setupAccounts } from './setup/setup-accounts';
import './worker/bulk-import';

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
  const unchainedAPI = await initCore({
    db,
    modules,
    bulkImporter: {
      BulkImportPayloads,
    },
    migrationRepository,
    options,
  });

  if (workQueueIsEnabled) {
    await runMigrations({ db, repository: migrationRepository });
  }

  setupAccounts(options, unchainedAPI);
  // setupTemplates(options);

  const typeDefs = [
    ...generateEventTypeDefs(),
    ...workerTypeDefs(),
    ...(typeDefs || []),
  ];

  startAPIServer({ ...options, typeDefs, unchainedAPI });

  if (emailInterceptionIsEnabled) interceptEmails(options);

  if (workQueueIsEnabled) {
    const handlers = setupWorkqueue(options, unchainedAPI);
    handlers.forEach((handler) => queueWorkers.push(handler));
    await setupCarts(options, unchainedAPI);
  }
};
