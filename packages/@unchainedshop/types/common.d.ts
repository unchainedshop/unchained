import { Db, UpdateFilter, ObjectId } from 'mongodb';

export type _ID = string | ObjectId;

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
  update: (_id: string, doc: UpdateFilter<T>, userId: string) => Promise<string>;
  delete: (_id: string, userId: string) => Promise<number>;
}
