import type { mongodb } from '@unchainedshop/mongodb';
import type { UnchainedCore } from './core-index.js';

export interface BulkImporter {
  createBulkImporter: (options: any) => any;
}

export interface Migration {
  id: number;
  name: string;
  up: (params: { logger: any | Console; unchainedAPI: UnchainedCore }) => Promise<void>;
}

export interface MigrationRepository<MigrationInstance extends Migration> {
  db: mongodb.Db;
  migrations: Map<number, MigrationInstance>;
  register: (migration: MigrationInstance) => void;
  allMigrations: () => Array<MigrationInstance>;
}

/*
 * Module
 */

export interface ModuleInput<Options extends Record<string, any>> {
  db: mongodb.Db;
  migrationRepository?: MigrationRepository<Migration>;
  options?: Options;
}

export interface ModuleCreateMutation<T> {
  create: (doc: T) => Promise<string | null>;
}

export interface ModuleMutations<T> extends ModuleCreateMutation<T> {
  update: (_id: string, doc: mongodb.UpdateFilter<T> | T) => Promise<string>;
  delete: (_id: string) => Promise<number>;
}
