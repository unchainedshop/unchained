import { UnchainedCoreOptions } from '@unchainedshop/types/api';
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

const checkWorkQueueEnabled = (options: SetupWorkqueueOptions) => {
  if (options?.disableWorker) return false;
  return !UNCHAINED_DISABLE_WORKER;
};

const isEmailInterceptionEnabled = (options) => {
  if (options?.disableEmailInterception) return false;
  return NODE_ENV !== 'production' && !UNCHAINED_DISABLE_EMAIL_INTERCEPTION;
};

export const queueWorkers = [];

type PlatformOptions = {
  accountsOptions?: SetupAccountsOptions;
  additionalTypeDefs: Array<string>;
  bulkImporter?: any;
  context?: any;
  modules: Record<string, any>;
  rolesOptions?: any;
  workQueueOptions?: SetupWorkqueueOptions & SetupCartsOptions;
  coreOptions: UnchainedCoreOptions['options'];
};
export const startPlatform = async (
  {
    modules,
    additionalTypeDefs = [],
    coreOptions = {},
    ...options
  }: PlatformOptions = {
    modules: undefined,
    additionalTypeDefs: [],
    coreOptions: {},
  }
) => {
  const isWorkQueueEnabled = checkWorkQueueEnabled(options.workQueueOptions);
  const emailInterceptionIsEnabled = isEmailInterceptionEnabled(options);

  // Configure database
  const db = initDb();

  // Initialise core api using the database
  const unchainedAPI = await initCore({
    db,
    modules,
    bulkImporter: {
      BulkImportPayloads,
    },
    options: coreOptions,
  });

  if (isWorkQueueEnabled) {
    await runMigrations({ db });
  }

  // Setup accountsjs specific extensions and event handlers
  setupAccounts(options.accountsOptions, unchainedAPI);

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
  if (isWorkQueueEnabled) {
    const handlers = setupWorkqueue(options.workQueueOptions, unchainedAPI);
    handlers.forEach((handler) => queueWorkers.push(handler));
    await setupCarts(options.workQueueOptions, unchainedAPI);
  }

  return unchainedAPI;
};