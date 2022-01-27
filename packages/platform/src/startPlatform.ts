import { UnchainedCoreOptions } from "@unchainedshop/types/api";
import { Meteor } from "meteor/meteor";
import { startAPIServer } from "meteor/unchained:api";
import { initCore } from "meteor/unchained:core";
import { initDb } from "meteor/unchained:mongodb";
import { BulkImportPayloads } from "./bulk-importer/createBulkImporter";
import { interceptEmails } from "./interceptEmails";
import { runMigrations } from "./migrations/runMigrations";
import { generateEventTypeDefs } from "./setup/generateEventTypeDefs";
import { generateWorkerTypeDefs } from "./setup/generateWorkTypeDefs";
import { setupAccounts, SetupAccountsOptions } from "./setup/setupAccounts";
import { setupAutoScheduling } from "./setup/setupAutoScheduling";
import { setupCarts, SetupCartsOptions } from "./setup/setupCarts";
import { MessageTypes, setupTemplates } from "./setup/setupTemplates";
import { setupWorkqueue, SetupWorkqueueOptions } from "./setup/setupWorkqueue";

// Workers
import "./worker/BulkImportWorker";
import "meteor/unchained:core-enrollments/workers/GenerateOrderWorker";
import "meteor/unchained:core-messaging/workers/MessageWorker";

export { MessageTypes };

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
  return NODE_ENV !== "production" && !UNCHAINED_DISABLE_EMAIL_INTERCEPTION;
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
  options: UnchainedCoreOptions["options"];
};
export const startPlatform = async (
  {
    modules,
    additionalTypeDefs = [],
    options = {},
    ...otherOptions
  }: PlatformOptions = {
    modules: undefined,
    additionalTypeDefs: [],
    options: {},
  }
) => {
  const isWorkQueueEnabled = checkWorkQueueEnabled(
    otherOptions.workQueueOptions
  );
  const emailInterceptionIsEnabled = isEmailInterceptionEnabled(otherOptions);

  // Configure database
  const db = initDb();

  // Initialise core api using the database
  const unchainedAPI = await initCore({
    db,
    modules,
    bulkImporter: {
      BulkImportPayloads,
    },
    options,
  });

  if (isWorkQueueEnabled) {
    await runMigrations({ db });
  }

  // Setup accountsjs specific extensions and event handlers
  setupAccounts(otherOptions.accountsOptions, unchainedAPI);

  // Setup email templates
  setupTemplates();

  // Combine type defs for graphQL schema
  const typeDefs = [
    ...generateEventTypeDefs(),
    ...generateWorkerTypeDefs(),
    ...additionalTypeDefs,
  ];

  // Start the graphQL server
  startAPIServer({ ...options, typeDefs, unchainedAPI });

  if (emailInterceptionIsEnabled) interceptEmails();

  // Setup work queues for scheduled work
  if (isWorkQueueEnabled) {
    const handlers = setupWorkqueue(
      otherOptions.workQueueOptions,
      unchainedAPI
    );
    handlers.forEach((handler) => queueWorkers.push(handler));
    await setupCarts(otherOptions.workQueueOptions, unchainedAPI);

    setupAutoScheduling();
  }

  // Setup filter cache
  if (!options.filters.skipInvalidationOnStartup) {
    Meteor.defer(() =>
      unchainedAPI.modules.filters.invalidateCache({}, unchainedAPI)
    );
  }

  return unchainedAPI;
};
