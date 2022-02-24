import { UnchainedCoreOptions } from '@unchainedshop/types/api';
import { Meteor } from 'meteor/meteor';
import { startAPIServer } from 'meteor/unchained:api';
import { initCore } from 'meteor/unchained:core';
import { initDb } from 'meteor/unchained:mongodb';
import { createBulkImporterFactory } from './bulk-importer/createBulkImporter';
import { interceptEmails } from './interceptEmails';
import { runMigrations } from './migrations/runMigrations';
import { generateEventTypeDefs } from './setup/generateEventTypeDefs';
import { generateWorkerTypeDefs } from './setup/generateWorkTypeDefs';
import { setupAccounts, SetupAccountsOptions } from './setup/setupAccounts';
import { setupAutoScheduling } from './setup/setupAutoScheduling';
import { setupCarts, SetupCartsOptions } from './setup/setupCarts';
import { MessageTypes, setupTemplates } from './setup/setupTemplates';
import { setupWorkqueue, SetupWorkqueueOptions } from './setup/setupWorkqueue';
import { createMigrationRepository } from './migrations/migrationRepository';

// Workers
import './worker/BulkImportWorker';
import 'meteor/unchained:core-enrollments/workers/GenerateOrderWorker';
import 'meteor/unchained:core-messaging/workers/MessageWorker';

export { MessageTypes };

const { NODE_ENV, UNCHAINED_DISABLE_EMAIL_INTERCEPTION, UNCHAINED_DISABLE_WORKER } = process.env;

const checkWorkQueueEnabled = (options: SetupWorkqueueOptions) => {
  if (options?.disableWorker) return false;
  return !UNCHAINED_DISABLE_WORKER;
};

const checkEmailInterceptionEnabled = (disableEmailInterception) => {
  if (disableEmailInterception) return false;
  return NODE_ENV !== 'production' && !UNCHAINED_DISABLE_EMAIL_INTERCEPTION;
};

export const queueWorkers = [];

type PlatformOptions = {
  accountsOptions?: SetupAccountsOptions;
  additionalTypeDefs: Array<string>;
  bulkImporter?: any;
  context?: any;
  modules: UnchainedCoreOptions['modules'];
  options: UnchainedCoreOptions['options'];
  rolesOptions?: any;
  workQueueOptions?: SetupWorkqueueOptions & SetupCartsOptions;
  disableEmailInterception?: any;
};
export const startPlatform = async (
  {
    modules,
    additionalTypeDefs = [],
    options = {},
    rolesOptions,
    accountsOptions,
    workQueueOptions,
    disableEmailInterception,
    context,
  }: PlatformOptions = {
    modules: {},
    additionalTypeDefs: [],
    options: {},
  },
) => {
  // Configure database
  const db = initDb();

  // Prepare Migrations
  const migrationRepository = createMigrationRepository(db);
  const bulkImporter = createBulkImporterFactory(db);

  // Initialise core api using the database
  const unchainedAPI = await initCore({
    db,
    migrationRepository,
    bulkImporter,
    modules,
    options,
  });

  const isWorkQueueEnabled = checkWorkQueueEnabled(workQueueOptions);
  if (isWorkQueueEnabled) {
    await runMigrations({ migrationRepository, unchainedAPI });
  }

  // Setup accountsjs specific extensions and event handlers
  setupAccounts(accountsOptions, unchainedAPI);

  // Setup email templates
  setupTemplates();

  // Combine type defs for graphQL schema
  const typeDefs = [...generateEventTypeDefs(), ...generateWorkerTypeDefs(), ...additionalTypeDefs];

  // Start the graphQL server
  startAPIServer({
    unchainedAPI,
    rolesOptions,
    typeDefs,
    context,
  });

  if (checkEmailInterceptionEnabled(disableEmailInterception)) interceptEmails();

  // Setup work queues for scheduled work
  if (isWorkQueueEnabled) {
    const handlers = setupWorkqueue(workQueueOptions, unchainedAPI);
    handlers.forEach((handler) => queueWorkers.push(handler));
    await setupCarts(workQueueOptions, unchainedAPI);

    setupAutoScheduling();
  }

  // Setup filter cache
  if (!options.filters?.skipInvalidationOnStartup) {
    Meteor.defer(() => unchainedAPI.modules.filters.invalidateCache({}, unchainedAPI));
  }

  return unchainedAPI;
};
