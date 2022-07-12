import { SetupWorkqueueOptions, PlatformOptions, MessageTypes } from '@unchainedshop/types/platform';
import { startAPIServer, roles } from '@unchainedshop/api';
import { initCore } from '@unchainedshop/core';
import { initDb } from '@unchainedshop/mongodb';
import { createLogger } from '@unchainedshop/logger';
import { createBulkImporterFactory } from './bulk-importer/createBulkImporter';
import { runMigrations } from './migrations/runMigrations';
import { generateEventTypeDefs } from './setup/generateEventTypeDefs';
import { generateWorkerTypeDefs } from './setup/generateWorkTypeDefs';
import { generateRoleActionTypeDefs } from './setup/generateRoleActionTypeDefs';
import { setupAccounts } from './setup/setupAccounts';
import { setupAutoScheduling } from './setup/setupAutoScheduling';
import { setupCarts } from './setup/setupCarts';
import { setupTemplates } from './setup/setupTemplates';
import { setupWorkqueue } from './setup/setupWorkqueue';
import { createMigrationRepository } from './migrations/migrationRepository';

// Workers
import '@unchainedshop/plugins/worker/BulkImportWorker';
import '@unchainedshop/plugins/worker/ZombieKillerWorker';
import '@unchainedshop/plugins/worker/GenerateOrderWorker';
import '@unchainedshop/plugins/worker/MessageWorker';

export { MessageTypes };

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

export const queueWorkers = [];

export const startPlatform = async (
  {
    modules = {},
    services = {},
    typeDefs = [],
    resolvers = [],
    options = {},
    rolesOptions = {},
    expressApp,
    bulkImporter: bulkImporterOptions,
    schema,
    plugins,
    cache,
    workQueueOptions,
    context,
    introspection,
    playground,
    tracing,
    cacheControl,
    corsOrigins,
  }: PlatformOptions = {
    modules: {},
    services: {},
    typeDefs: [],
    resolvers: [],
    options: {},
  },
) => {
  exitOnMissingEnvironmentVariables();

  // Configure database
  const db = await initDb();

  // Prepare Migrations
  const migrationRepository = createMigrationRepository(db);
  const bulkImporter = createBulkImporterFactory(db, bulkImporterOptions?.handlers);

  // Initialise core api using the database
  const unchainedAPI = await initCore({
    db,
    migrationRepository,
    bulkImporter,
    modules,
    services,
    options,
  });

  const isWorkQueueEnabled = checkWorkQueueEnabled(workQueueOptions);
  if (isWorkQueueEnabled) {
    await runMigrations({ migrationRepository, unchainedAPI });
  }

  const configuredRoles = roles.configureRoles(rolesOptions);

  // Setup accountsjs specific extensions and event handlers
  setupAccounts(unchainedAPI);

  // Setup email templates
  setupTemplates();

  const generatedTypeDefs = [
    ...generateEventTypeDefs(),
    ...generateWorkerTypeDefs(),
    ...generateRoleActionTypeDefs(),
  ];

  // Start the graphQL server
  startAPIServer({
    unchainedAPI,
    roles: configuredRoles,
    typeDefs: [...generatedTypeDefs, ...typeDefs],
    resolvers,
    schema,
    plugins,
    expressApp,
    cache,
    context,
    introspection,
    playground,
    tracing,
    corsOrigins,
    cacheControl,
  });

  // Setup work queues for scheduled work
  if (isWorkQueueEnabled) {
    const handlers = setupWorkqueue(unchainedAPI, workQueueOptions);
    handlers.forEach((handler) => queueWorkers.push(handler));
    await setupCarts(unchainedAPI, workQueueOptions);

    setupAutoScheduling();
  }

  // Setup filter cache
  if (!options.filters?.skipInvalidationOnStartup) {
    setImmediate(() => unchainedAPI.modules.filters.invalidateCache({}, unchainedAPI));
  }

  return unchainedAPI;
};
