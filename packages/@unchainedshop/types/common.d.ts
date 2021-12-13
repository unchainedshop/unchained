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
} from 'mongodb';

export {
  Db,
  Collection,
  FindOptions,
  UpdateFilter as Update,
  Filter,
  Sort,
  ModifyResult,
  Projection,
};

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

export type Query = { [x: string]: any };

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
