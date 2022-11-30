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
  GridFSBucket,
} from 'mongodb';
import type { Locale, Locales } from 'locale';
import { LogOptions } from './logs';

export { Locale, Locales };

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
  GridFSBucket,
};

export type _ID = string;

export type Query = { [x: string]: any };

export type Indexes<T extends Document> = Array<{
  index: { [key in keyof T]?: IndexDirection }; // TODO: Support key with object path (e.g. 'product.proxy.assignments')
  options?: CreateIndexesOptions;
}>;

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
  updated?: Date;
  deleted?: Date;
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
  getAdapters: (options?: { adapterFilter?: (adapter: Adapter) => boolean }) => Array<Adapter>;
  getAdapter: (key: string) => Adapter;
  registerAdapter: (A: Adapter) => void;
}

export type NodeOrTree<T> = string | Tree<T>; // eslint-disable-line
export type Tree<T> = Array<NodeOrTree<T>>;
