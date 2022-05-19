import { Db, MigrationRepository, ModuleInput } from './common';
import { Logger } from './logs';
import { UnchainedAPI } from './api';
import { Modules, ModuleOptions } from './modules';
import { Services } from './services';

export interface Migration {
  id: number;
  name: string;
  up: (params: { logger: Logger | Console; unchainedAPI: UnchainedAPI }) => Promise<void>;
}

export interface UnchainedCore {
  modules: Modules;
  services: Services;
  bulkImporter: any;
  options: ModuleOptions;
}

export interface UnchainedCoreOptions {
  db: Db;
  migrationRepository: MigrationRepository<Migration>;
  bulkImporter: any;
  modules: Record<
    string,
    {
      configure: (params: ModuleInput<any>) => any;
    }
  >;
  services: Record<string, any>;
  options: ModuleOptions;
}
