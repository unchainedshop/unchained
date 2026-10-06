import { startAPIServer, roles, type UnchainedServerOptions } from '@unchainedshop/api';
import { initCore, type UnchainedCoreOptions, pluginRegistry } from '@unchainedshop/core';
import { initDb, mongodb, stopDb } from '@unchainedshop/mongodb';
import { defaultLogger } from '@unchainedshop/logger';
import { getEmitAdapter } from '@unchainedshop/events';
import type { UnchainedCore } from '@unchainedshop/core';
import {
  createAuditLog,
  configureAuditIntegration,
  setAuditLogInstance,
  type AuditLogOptions,
  type AuditLog,
} from '@unchainedshop/events';
import { setupAccounts } from './setup/setupAccounts.ts';
import { setupUploadHandlers } from './setup/setupUploadHandlers.ts';
import { setupTemplates, MessageTypes } from './setup/setupTemplates.ts';
import { type SetupWorkqueueOptions, stopWorkqueue, setupWorkqueue } from './setup/setupWorkqueue.ts';
import { createMigrationRepository } from './migrations/migrationRepository.ts';
import type { IRoleOptionConfig } from '@unchainedshop/roles';

const { UNCHAINED_API_VERSION, npm_package_version } = process.env;

export { MessageTypes };

export type PlatformOptions = {
  rolesOptions?: IRoleOptionConfig;
  workQueueOptions?: SetupWorkqueueOptions;
  auditLog?: AuditLogOptions | false;
} & Omit<UnchainedCoreOptions, 'migrationRepository' | 'db'> &
  Omit<UnchainedServerOptions, 'roles' | 'unchainedAPI'>;

const REQUIRED_ENV_VARIABLES = [
  'EMAIL_WEBSITE_NAME',
  'EMAIL_WEBSITE_URL',
  'EMAIL_FROM',
  'ROOT_URL',
  'UNCHAINED_TOKEN_SECRET',
];

const CLEANUP_FORCE_EXIT_TIMEOUT_MS = 15000;

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
  rolesOptions,
  bulkImporter,
  bulkExporter,
  workQueueOptions,
  auditLog: auditLogConfig,
  ...arbitraryAPIServerConfiguration
}: PlatformOptions): Promise<{
  unchainedAPI: UnchainedCore;
  graphqlHandler: any;
  db: mongodb.Db;
  shutdown: () => Promise<void>;
}> => {
  const start = performance.now();

  exitOnMissingEnvironmentVariables();
  existOnInvalidEnvironmentVariables();

  const configuredRoles = roles.configureRoles(rolesOptions || {});

  // Configure database
  const db = await initDb();

  // Prepare Migrations
  const migrationRepository = createMigrationRepository(db);

  // Get plugin modules from registry
  const pluginModuleFactories = pluginRegistry.getModuleFactories();
  const pluginModules = pluginModuleFactories.reduce(
    (acc, factory) => {
      const factoryModules = factory({ db });
      // Wrap each module in the required { configure: fn } structure
      Object.entries(factoryModules).forEach(([key, moduleInstance]) => {
        acc[key] = {
          configure: () => moduleInstance,
        };
      });
      return acc;
    },
    {} as Record<string, any>,
  );

  // Merge plugin modules with custom modules (custom modules take precedence)
  const allModules = { ...pluginModules, ...(modules || {}) };

  // Initialise core api using the database
  const unchainedAPI = await initCore({
    db,
    migrationRepository,
    bulkImporter,
    modules: allModules,
    services,
    options,
    bulkExporter,
  });

  // Initialize plugins (call onRegister hooks)
  await pluginRegistry.initialize(unchainedAPI);

  // Create audit log instance (integration configured after events are registered)
  let auditLog: AuditLog | undefined;
  if (auditLogConfig !== false) {
    auditLog = createAuditLog(auditLogConfig || {});
    setAuditLogInstance(auditLog);
  }

  // Setup Accounts specific extensions and event handlers
  setupAccounts(unchainedAPI);

  // Setup Messaging Templates
  setupTemplates(unchainedAPI);

  // Setup File Upload Handlers
  setupUploadHandlers(unchainedAPI);

  // Start GraphQL Server (registers API events)
  const graphqlHandler = await startAPIServer({
    unchainedAPI,
    roles: configuredRoles,
    ...arbitraryAPIServerConfiguration,
  });

  // Configure audit integration after all events are registered
  if (auditLog) {
    configureAuditIntegration(auditLog);
  }

  // Setup Work Queue
  await setupWorkqueue({
    unchainedAPI,
    migrationRepository,
    ...workQueueOptions,
  });

  const version = UNCHAINED_API_VERSION || npm_package_version || 'n/a';

  defaultLogger.info(`Unchained Engine running`, { version });

  let shutdownPromise: Promise<void> | undefined;

  // The cleanup of the signal handlers without exiting the process; stopDb() also stops a MongoDB
  // started in this process (by initDb() or a caller's startDb()). Every call returns the same
  // promise, so the signal handlers and a caller like a test harness share one shutdown.
  const shutdown = () => {
    shutdownPromise ??= (async () => {
      defaultLogger.debug('Stopping Workqueue');
      stopWorkqueue();

      defaultLogger.debug('Shutting down plugins');
      await pluginRegistry.shutdown(unchainedAPI);

      defaultLogger.debug('Shutting down event emitter');
      await getEmitAdapter()?.shutdown?.();

      defaultLogger.debug('Stopping GraphQL server');
      await graphqlHandler.dispose();

      if (auditLog) {
        defaultLogger.debug('Closing audit log');
        await auditLog.close();
      }

      defaultLogger.debug('Stopping DB Connection');
      await stopDb();
    })();
    return shutdownPromise;
  };

  const cleanup = (signal: string) => async () => {
    // Prevent multiple concurrent cleanup attempts. Once shutdown() has started, also from a caller
    // like a test harness, signals and process errors no longer exit the process.
    if (shutdownPromise) {
      defaultLogger.debug('Cleanup already in progress, ignoring signal', { signal });
      return;
    }

    defaultLogger.debug('Starting cleanup', { signal });

    // Force exit if cleanup takes too long
    const forceExitTimeout = setTimeout(() => {
      defaultLogger.error('Cleanup timeout exceeded, forcing exit');
      process.exit(1);
    }, CLEANUP_FORCE_EXIT_TIMEOUT_MS);

    // Ensure timeout doesn't keep process alive
    forceExitTimeout.unref();

    try {
      await shutdown();

      defaultLogger.debug(`Unchained Engine exiting gracefully`, { signal, version });
      clearTimeout(forceExitTimeout);
      process.exit(0);
    } catch (error) {
      defaultLogger.error('Error during cleanup', {
        signal,
        error: error instanceof Error ? error.message : String(error),
      });
      clearTimeout(forceExitTimeout);
      process.exit(1);
    }
  };

  // Standard termination signals
  process.on('SIGTERM', cleanup('SIGTERM'));
  process.on('SIGINT', cleanup('SIGINT'));

  // Handle uncaught exceptions - attempt graceful shutdown
  process.on('uncaughtException', async (error) => {
    defaultLogger.error('Uncaught exception', { error: error.message, stack: error.stack });
    await cleanup('uncaughtException')();
  });

  // Handle unhandled promise rejections - attempt graceful shutdown
  process.on('unhandledRejection', async (reason) => {
    defaultLogger.error('Unhandled rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
    await cleanup('unhandledRejection')();
  });

  const end = performance.now();
  defaultLogger.debug(`Unchained Engine started in ${(end - start).toFixed(0)} ms`);

  return { unchainedAPI, graphqlHandler, db, shutdown };
};
