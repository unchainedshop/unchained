import { UnchainedServerOptions } from '@unchainedshop/types/api';
import { startAPIServer } from 'meteor/unchained:api';
import { initCore } from 'meteor/unchained:core';
import { initDb } from 'meteor/unchained:mongodb';
import { BulkImportPayloads } from './bulk-importer/createBulkImporter';
import { generateEventTypeDefs } from './generateRegisteredEvents';
import { interceptEmails } from './interceptEmails';
import { runMigrations } from './migrations/runMigrations';
import { setupAccounts, SetupAccountsOptions } from './setup/setupAccounts';
import { setupCarts, SetupCartsOptions } from './setup/setupCarts';
// import { setupTemplates, MessageTypes } from '../setup-templates';
import {
  setupWorkqueue,
  SetupWorkqueueOptions,
  workerTypeDefs,
} from './setup/setupWorkqueue';
import './worker/BulkImportWorker';

// export { MessageTypes };

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

type PlatformOptions = {
  accountOptions?: SetupAccountsOptions;
  additionalTypeDefs: Array<string>;
  bulkImporter?: any;
  context?: any;
  modules: Record<string, any>;
  rolesOptions?: any;
  workQueueOptions?: SetupWorkqueueOptions & SetupCartsOptions;
};
export const startPlatform = async (
  { modules, additionalTypeDefs = [], ...options }: PlatformOptions = {
    modules: undefined,
    additionalTypeDefs: [],
  }
) => {
  const workQueueIsEnabled = isWorkQueueEnabled(options);
  const emailInterceptionIsEnabled = isEmailInterceptionEnabled(options);

  // Configure database
  const db = initDb();

  // Initialise core api using the database
  const unchainedAPI = initCore({
    db,
    modules,
    bulkImporter: {
      BulkImportPayloads,
    },
    options,
  });

  if (workQueueIsEnabled) {
    await runMigrations({ db });
  }

  // Setup accountsjs specific extensions and event handlers
  setupAccounts(options.accountOptions, unchainedAPI);

  // Setup email templates
  // setupTemplates(options);

  // Combine type defs for graphQL schema
  const typeDefs = [
    ...generateEventTypeDefs(),
    ...workerTypeDefs(),
    ...additionalTypeDefs,
  ];

  // Start the graphQL server
  startAPIServer({ ...options, typeDefs, unchainedAPI });

  if (emailInterceptionIsEnabled) interceptEmails();

  // Setup work queues for scheduled work
  if (workQueueIsEnabled) {
    const handlers = setupWorkqueue(options.workQueueOptions, unchainedAPI);
    handlers.forEach((handler) => queueWorkers.push(handler));
    await setupCarts(options.workQueueOptions, unchainedAPI);
  }
};
