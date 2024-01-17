import { startAPIServer, roles } from '@unchainedshop/api';
import { initCore } from '@unchainedshop/core';
import { initDb } from '@unchainedshop/mongodb';
import { createLogger } from '@unchainedshop/logger';
import { UnchainedCore, UnchainedCoreOptions } from '@unchainedshop/types/core.js';
import { getRegisteredEvents } from '@unchainedshop/events';
import { WorkerDirector } from '@unchainedshop/core-worker';
import { AdminUiConfig } from '@unchainedshop/types/api.js';
import { Db } from 'mongodb';
import { BulkImportHandler, createBulkImporterFactory } from './bulk-importer/createBulkImporter.js';
import { runMigrations } from './migrations/runMigrations.js';
import { setupAccounts } from './setup/setupAccounts.js';
import { SetupCartsOptions, setupCarts } from './setup/setupCarts.js';
import { setupTemplates, MessageTypes } from './setup/setupTemplates.js';
import { SetupWorkqueueOptions, setupWorkqueue } from './setup/setupWorkqueue.js';
import { createMigrationRepository } from './migrations/migrationRepository.js';

export { MessageTypes };

export type PlatformOptions = {
  typeDefs?: Array<string>;
  resolvers?: any;
  schema?: any;
  plugins?: any[];
  cache?: any;
  bulkImporter?: {
    handlers?: Record<string, BulkImportHandler>;
  };
  context?: any;
  modules?: UnchainedCoreOptions['modules'];
  services?: UnchainedCoreOptions['modules'];
  options?: UnchainedCoreOptions['options'];
  rolesOptions?: UnchainedCoreOptions['roleOptions'];
  workQueueOptions?: SetupWorkqueueOptions & SetupCartsOptions;
  introspection?: boolean;
  adminUiConfig?: AdminUiConfig;
};

const logger = createLogger('unchained');

const REQUIRED_ENV_VARIABLES = ['EMAIL_WEBSITE_NAME', 'EMAIL_WEBSITE_URL', 'EMAIL_FROM'];

const { UNCHAINED_DISABLE_WORKER } = process.env;

const exitOnMissingEnvironmentVariables = () => {
  const failedEnv = REQUIRED_ENV_VARIABLES.filter((key) => !process.env[key]);
  if (failedEnv.length > 0) {
    logger.error(`Missing required environment variables at boot time: ${failedEnv.join(', ')}`);
    process.exit(1);
  }
};

const checkWorkQueueEnabled = (options: SetupWorkqueueOptions) => {
  if (options?.disableWorker) return false;
  return !UNCHAINED_DISABLE_WORKER;
};

export const queueWorkers: Array<any> = [];

export const startPlatform = async ({
  modules = {},
  services = {},
  typeDefs = [],
  resolvers = [],
  options = {},
  adminUiConfig = {},
  rolesOptions = {},
  bulkImporter: bulkImporterOptions,
  schema,
  plugins,
  cache,
  workQueueOptions,
  context,
  introspection,
}: PlatformOptions): Promise<{
  unchainedAPI: UnchainedCore;
  apolloGraphQLServer: any;
  db: Db;
}> => {
  exitOnMissingEnvironmentVariables();

  // Configure database
  const db = await initDb();

  // Prepare Migrations
  const migrationRepository = createMigrationRepository(db);
  const bulkImporter = createBulkImporterFactory(db, bulkImporterOptions);

  // Initialise core api using the database
  const unchainedAPI = await initCore({
    db,
    migrationRepository,
    bulkImporter,
    modules,
    services,
    options,
    roleOptions: rolesOptions,
  });

  const isWorkQueueEnabled = checkWorkQueueEnabled(workQueueOptions);
  if (isWorkQueueEnabled) {
    await runMigrations({ migrationRepository, unchainedAPI });
  }

  const configuredRoles = roles.configureRoles(rolesOptions);
  const configuredEvents = getRegisteredEvents();
  const configuredWorkTypes = WorkerDirector.getActivePluginTypes();

  // Setup accountsjs specific extensions and event handlers
  setupAccounts(unchainedAPI);

  // Setup email templates
  setupTemplates();

  // Start the graphQL server
  const apolloGraphQLServer = await startAPIServer({
    unchainedAPI,
    roles: configuredRoles,
    events: configuredEvents,
    workTypes: configuredWorkTypes,
    typeDefs,
    resolvers,
    schema,
    plugins,
    cache,
    context,
    introspection,
    adminUiConfig,
  });

  // Setup work queues for scheduled work
  if (isWorkQueueEnabled) {
    const handlers = setupWorkqueue(unchainedAPI, workQueueOptions);
    handlers.forEach((handler) => queueWorkers.push(handler));
    await setupCarts(unchainedAPI, workQueueOptions);
  }

  // Setup filter cache
  if (!options.filters?.skipInvalidationOnStartup) {
    setImmediate(() => unchainedAPI.modules.filters.invalidateCache({}, unchainedAPI));
  }

  return { unchainedAPI, apolloGraphQLServer, db };
};
