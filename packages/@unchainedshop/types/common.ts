import {
  Collection,
  CreateIndexesOptions,
  Db,
  Document,
  Filter,
  FindOptions,
  ModifyResult,
  ObjectId,
  Projection,
  Sort,
  UpdateFilter,
  IndexDirection,
} from 'mongodb';
import { LogOptions } from './logs';

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
};

export type Query = { [x: string]: any };

export type Indexes<T extends Document> = Array<{
  index: { [key in keyof T]?: IndexDirection }; // TODO: Support key with object path (e.g. product.proxy.assignments)
  options?: CreateIndexesOptions;
}>;

/*
 * Module
 */

export interface ModuleInput<Options extends {}> {
  db: Db;
  options?: Options
}

export interface ModuleCreateMutation<T> {
  create: (doc: T, userId?: string) => Promise<string | null>;
}

export interface ModuleMutations<T> extends ModuleCreateMutation<T> {
  update: (
    _id: string,
    doc: UpdateFilter<T>,
    userId?: string
  ) => Promise<string>;
  delete: (_id: string, userId?: string) => Promise<number>;
}

/*
 * Data definitions
 */

export type _ID = string;

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
  getAdapters: (options?: {
    adapterFilter?: (adapter: Adapter) => Promise<boolean>;
  }) => Array<Adapter>;
  getAdapter: (key: string) => Adapter;
  registerAdapter: (A: Adapter) => void;
}
