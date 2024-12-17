import { mongodb, MigrationRepository, ModuleInput } from '@unchainedshop/mongodb';
import initServices, { Services } from './services/index.js';
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
  services?: Record<string, (this: Modules, ...args) => any>;
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
  modules: customModules = {},
  services: customServices = {},
  options = {},
}: UnchainedCoreOptions): Promise<UnchainedCore> => {
  // Configure custom modules

  const modules = await initModules({ db, migrationRepository, options }, customModules);
  const services = initServices(modules, {
    asdf: (test: string) => {
      return test;
    },
  });

  return {
    modules,
    services,
    bulkImporter,
    options,
  };
};
