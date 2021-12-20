import {
  Db,
  Collection,
  UpdateFilter,
  Filter,
  ObjectId,
  FindOptions,
  Sort,
  ModifyResult,
  Projection,
  CreateIndexesOptions,
  Document,
} from 'mongodb';
import { Context } from './api';
import { log, LogLevel, LogOptions } from './logs';

/*
 * MongoDb
 */

export {
  Collection,
  Db,
  Document,
  Filter,
  FindOptions,
  ModifyResult,
  Projection,
  Sort,
  UpdateFilter as Update,
};

export type Query = { [x: string]: any };

export type Indexes<T extends Document> = Array<{
  index: Record<keyof T, number | 'text'>;
  options?: CreateIndexesOptions;
}>;

/*
 * Module
 */

export interface ModuleInput {
  db: Db;
}

export interface ModuleCreateMutation<T> {
  create: (doc: T, userId: string) => Promise<string | null>;
}

export interface ModuleMutations<T> extends ModuleCreateMutation<T> {
  update: (
    _id: string,
    doc: UpdateFilter<T>,
    userId: string
  ) => Promise<string>;
  delete: (_id: string, userId: string) => Promise<number>;
}

/*
 * Data definitions
 */

export type _ID = string | ObjectId;

export type LogFields = Array<{
  date: Date;
  type: string;
  info: string;
}>;

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
  log: (message: string, options: LogOptions) => void;
}

export interface IBaseDirector<Adapter extends IBaseAdapter> {
  getAdapters: () => Array<Adapter>;
  getAdapter: (key) => Adapter;
  registerAdapter: (A: Adapter) => void;
}
