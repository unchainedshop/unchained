import {
  Collection,
  CreateIndexesOptions,
  Db,
  Document,
  Filter,
  FindOptions,
  IndexDirection,
  ModifyResult,
  ObjectId,
  Projection,
  Sort,
  UpdateFilter,
  UpdateOptions,
} from 'mongodb';
import { LogOptions } from './logs';

export { Locale, Locales } from 'locale';
/*
 * MongoDb
 */
export type {
  Collection,
  Db,
  Document,
  Filter,
  FindOptions,
  ModifyResult,
  ObjectId,
  Projection,
  Sort,
  UpdateFilter as Update,
  UpdateOptions,
};

export type _ID = string;

export type Query = { [x: string]: any };

export type Indexes<T extends Document> = Array<{
  index: { [key in keyof T]?: IndexDirection }; // TODO: Support key with object path (e.g. 'product.proxy.assignments')
  options?: CreateIndexesOptions;
}>;

/*
 * Module
 */

export interface MigrationRepository<Migration> {
  migrations: Map<number, Migration>;
  register: (migration: Migration) => void;
  allMigrations: () => Array<Migration>;
}

export interface ModuleInput<Options extends Record<string, any>> {
  db: Db;
  migrationRepository?: MigrationRepository<any>;
  options?: Options;
}

export interface ModuleCreateMutation<T> {
  create: (doc: T, userId?: string) => Promise<string | null>;
}

export interface ModuleMutations<T> extends ModuleCreateMutation<T> {
  update: (_id: string, doc: UpdateFilter<T> | T, userId?: string) => Promise<string>;
  delete: (_id: string, userId?: string) => Promise<number>;
}

export interface ModuleMutationsWithReturnDoc<T> {
  create: (doc: T, userId?: string) => Promise<T>;
  update: (_id: _ID, doc: UpdateFilter<T> | T, userId?: string) => Promise<T>;
  delete: (_id: _ID, userId?: string) => Promise<T>;
}

/*
 * Data definitions
 */

export type Configuration = Array<{ key: string; value: string }>;

export type LogFields = {
  log: Array<{
    date: Date;
    status?: string;
    info: string;
  }>;
};

export type TimestampFields = {
  created?: Date;
  createdBy?: string;
  updated?: Date;
  updatedBy?: string;
  deleted?: Date;
  deletedBy?: string;
};

export interface Address {
  addressLine?: string;
  addressLine2?: string;
  city?: string;
  company?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  postalCode?: string;
  regionCode?: string;
}

export interface Contact {
  telNumber?: string;
  emailAddress?: string;
}

/*
 * Adapter & Director
 */

export interface IBaseAdapter {
  key: string;
  label: string;
  version: string;
  log: (message: string, options?: LogOptions) => void;
}

export interface IBaseDirector<Adapter extends IBaseAdapter> {
  getAdapters: (options?: { adapterFilter?: (adapter: Adapter) => Promise<boolean> }) => Array<Adapter>;
  getAdapter: (key: string) => Adapter;
  registerAdapter: (A: Adapter) => void;
}
