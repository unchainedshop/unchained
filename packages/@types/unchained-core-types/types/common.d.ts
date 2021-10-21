export type TimestampFields = {
  created?: Date,
  createdBy?: string
  updated?: Date,
  updatedBy?: string,
  deleted?: Date,
  deletedBy?: string,
};

export type Query = { [x: string]: any };

export interface ModuleInput { db: Db, userId?: string } 