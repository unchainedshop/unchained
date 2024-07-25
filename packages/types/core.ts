import type { Db, UpdateFilter } from 'mongodb';
import { Modules, ModuleOptions } from './modules.js';
import { Services } from './services.js';

export interface BulkImporter {
  createBulkImporter: (options: any) => any;
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
  up: (params: { logger: any | Console; unchainedAPI: UnchainedCore }) => Promise<void>;
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
  update: (_id: string, doc: UpdateFilter<T> | T) => Promise<string>;
  delete: (_id: string) => Promise<number>;
  deletePermanently: (_id: string) => Promise<number>;
}

export interface ModuleMutationsWithReturnDoc<T> {
  create: (doc: T) => Promise<T>;
  update: (_id: string, doc: UpdateFilter<T> | T) => Promise<T>;
  delete: (_id: string) => Promise<T>;
  deletePermanently: (_id: string) => Promise<T>;
}
