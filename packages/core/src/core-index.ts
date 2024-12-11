import { mongodb, MigrationRepository, ModuleInput } from '@unchainedshop/mongodb';
import defaultServices, { Services } from './services/index.js';
import initModules, { Modules, ModuleOptions } from './modules.js';

export * from './services/index.js';
export * from './directors/index.js';

export interface BulkImporter {
  createBulkImporter: (options: any) => any;
}

export interface UnchainedCoreOptions {
  db: mongodb.Db;
  migrationRepository: MigrationRepository<UnchainedCore>;
  bulkImporter: any;
  modules?: Record<
    string,
    {
      configure: (params: ModuleInput<any>) => any;
    }
  >;
  services?: Record<string, any>;
  options?: ModuleOptions;
}

export interface UnchainedCore {
  modules: Modules;
  services: Services;
  bulkImporter: BulkImporter;
  options: ModuleOptions;
}

export const initCore = async ({
  db,
  migrationRepository,
  bulkImporter,
  modules = {},
  services = {},
  options = {},
}: UnchainedCoreOptions): Promise<UnchainedCore> => {
  // Configure custom modules
  const customModules = await Object.entries(modules).reduce(
    async (modulesPromise, [key, customModule]: any) => {
      return {
        ...(await modulesPromise),
        [key]: await customModule.configure({
          db,
          options: options?.[key],
          migrationRepository,
        }),
      };
    },
    Promise.resolve({}),
  );

  const defaultModules = await initModules({ db, migrationRepository, options });

  return {
    modules: {
      ...defaultModules,
      ...customModules,
    },
    services: {
      ...defaultServices,
      ...services,
    },
    bulkImporter,
    options,
  };
};
