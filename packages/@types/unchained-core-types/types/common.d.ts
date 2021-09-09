export type TimestampFields = {
  created: Date,
  updated?: Date,
  deleted?: Date,
};

export type Query = { [x: string]: any };