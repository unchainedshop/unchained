import { startAPIServer, roles, UnchainedServerOptions } from '@unchainedshop/api';
import { initCore, UnchainedCoreOptions } from '@unchainedshop/core';
import { initDb, mongodb, stopDb } from '@unchainedshop/mongodb';
import { defaultLogger } from '@unchainedshop/logger';
import { UnchainedCore } from '@unchainedshop/core';
import { BulkImportHandler, createBulkImporterFactory } from './bulk-importer/createBulkImporter.js';
import { setupAccounts } from './setup/setupAccounts.js';
import { setupUploadHandlers } from './setup/setupUploadHandlers.js';
import { setupTemplates, MessageTypes } from './setup/setupTemplates.js';
import { SetupWorkqueueOptions, stopWorkqueue, setupWorkqueue } from './setup/setupWorkqueue.js';
import { createMigrationRepository } from './migrations/migrationRepository.js';
import { IRoleOptionConfig } from '@unchainedshop/roles';
import { setupMCPChatHandler } from './setup/setupMCPChatHandler.js';

export { MessageTypes };

export type PlatformOptions = {
  bulkImporter?: {
    handlers?: Record<string, BulkImportHandler>;
  };
  rolesOptions?: IRoleOptionConfig;
  workQueueOptions?: SetupWorkqueueOptions;
  chatConfiguration?: {
    tools?: any[];
    model?: any;
    messages?: any;
    maxTokens?: number;
    maxSteps?: number;
    system?: string;
  };
} & Omit<UnchainedCoreOptions, 'bulkImporter' | 'migrationRepository' | 'db'> &
  Omit<UnchainedServerOptions, 'roles' | 'unchainedAPI'>;

const REQUIRED_ENV_VARIABLES = [
  'EMAIL_WEBSITE_NAME',
  'EMAIL_WEBSITE_URL',
  'EMAIL_FROM',
  'ROOT_URL',
  'UNCHAINED_TOKEN_SECRET',
];

const exitOnMissingEnvironmentVariables = () => {
  const failedEnv = REQUIRED_ENV_VARIABLES.filter((key) => !process.env[key]);
  if (failedEnv.length > 0) {
    defaultLogger.error(`Missing required environment variables at boot time: ${failedEnv.join(', ')}`);
    process.exit(1);
  }
};

const existOnInvalidEnvironmentVariables = () => {
  if ((process.env?.UNCHAINED_TOKEN_SECRET || '').length < 32) {
    defaultLogger.error(
      'UNCHAINED_TOKEN_SECRET must be assigned a string that has a length of 32 or greater',
    );
    process.exit(1);
  }
};

export const startPlatform = async ({
  modules,
  services,
  options,
  rolesOptions = {},
  bulkImporter: bulkImporterOptions,
  workQueueOptions,
  chatConfiguration,
  ...arbitraryAPIServerConfiguration
}: PlatformOptions): Promise<{
  unchainedAPI: UnchainedCore;
  graphqlHandler: any;
  db: mongodb.Db;
  mcpChatHandler?: any;
}> => {
  exitOnMissingEnvironmentVariables();
  existOnInvalidEnvironmentVariables();

  const configuredRoles = roles.configureRoles(rolesOptions);

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
  });

  // Setup Accounts specific extensions and event handlers
  setupAccounts(unchainedAPI);

  // Setup Messaging Templates
  setupTemplates(unchainedAPI);

  // Setup File Upload Handlers
  setupUploadHandlers(unchainedAPI);

  // Start GraphQL Server
  const graphqlHandler = await startAPIServer({
    unchainedAPI,
    roles: configuredRoles,
    chatConfiguration,
    ...arbitraryAPIServerConfiguration,
  });

  // Setup Work Queue
  await setupWorkqueue({
    unchainedAPI,
    migrationRepository,
    ...workQueueOptions,
  });
  const mcpChatHandler = await setupMCPChatHandler(chatConfiguration, unchainedAPI);
  const { default: packageJson } = await import(`${import.meta.dirname}/../package.json`, {
    with: { type: 'json' },
  });
  defaultLogger.info(`Unchained Engine running`, { version: packageJson.version });

  const cleanup = (signal) => async () => {
    defaultLogger.debug('Stopping Workqueue', { signal });
    stopWorkqueue();
    defaultLogger.debug('Stopping GraphQL server', { signal });
    await graphqlHandler.dispose();
    defaultLogger.debug('Stopping DB Connection', { signal });
    await stopDb();
    defaultLogger.info(`Unchained Engine stopped`, { signal, version: packageJson.version });
    process.exit(0);
  };

  process.on('SIGTERM', cleanup('SIGTERM'));
  process.on('SIGINT', cleanup('SIGINT'));

  return { unchainedAPI, graphqlHandler, db, mcpChatHandler };
};
