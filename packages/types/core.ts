import { GridFSBucket } from 'mongodb';
import { Db, MigrationRepository, ModuleInput } from './common';
import { Logger } from './logs';
import { Context, UnchainedAPI } from './api';
import { Modules, ModuleOptions } from './modules';
import { Services } from './services';
import { IRoleOptionConfig } from './roles';

export interface Migration {
  id: number;
  name: string;
  up: (params: { logger: Logger | Console; unchainedAPI: UnchainedAPI }) => Promise<void>;
}

export interface BulkImporter {
  createBulkImporter: (options: any, requestContext: Context) => any;
  BulkImportPayloads: GridFSBucket;
}

export interface UnchainedCore {
  modules: Modules;
  services: Services;
  bulkImporter: BulkImporter;
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
  roleOptions: IRoleOptionConfig;
}
