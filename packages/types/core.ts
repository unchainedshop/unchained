import { Db, Update, _ID, GridFSBucket } from './common';
import { Logger } from './logs';
import { Modules, ModuleOptions } from './modules';
import { Services } from './services';
import { IRoleOptionConfig } from './roles';

export interface BulkImporter {
  createBulkImporter: (options: any) => any;
  BulkImportPayloads: GridFSBucket;
}

export interface UnchainedCore {
  modules: Modules;
  services: Services;
  bulkImporter: BulkImporter;
  options: ModuleOptions;
}

export interface Migration {
  id: number;
  name: string;
  up: (params: { logger: Logger | Console; unchainedAPI: UnchainedCore }) => Promise<void>;
}

export interface MigrationRepository<Migration> {
  db: Db;
  migrations: Map<number, Migration>;
  register: (migration: Migration) => void;
  allMigrations: () => Array<Migration>;
}

/*
 * Module
 */

export interface ModuleInput<Options extends Record<string, any>> {
  db: Db;
  migrationRepository?: MigrationRepository<Migration>;
  options?: Options;
}

export interface ModuleCreateMutation<T> {
  create: (doc: T) => Promise<string | null>;
}

export interface ModuleMutations<T> extends ModuleCreateMutation<T> {
  update: (_id: string, doc: Update<T> | T) => Promise<string>;
  delete: (_id: string) => Promise<number>;
  deletePermanently: (_id: string) => Promise<number>;
}

export interface ModuleMutationsWithReturnDoc<T> {
  create: (doc: T) => Promise<T>;
  update: (_id: _ID, doc: Update<T> | T) => Promise<T>;
  delete: (_id: _ID) => Promise<T>;
  deletePermanently: (_id: string) => Promise<T>;
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
