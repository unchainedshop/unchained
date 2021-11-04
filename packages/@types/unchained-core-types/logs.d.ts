import { Sort } from 'mongodb';
import { LoggerOptions } from 'winston';
import { ModuleMutations, TimestampFields, _ID } from './common';

export enum LogLevel {
  Info = 'info',
  Debug = 'debug',
  Error = 'error',
  Warning = 'warn',
}

export type Log = {
  _id?: _ID;
  level: LogLevel;
  message: string;
  meta?: unknown;
} & TimestampFields;

export interface LogOptions extends LoggerOptions {
  level: LogLevel;
}

export declare interface LogsModule extends ModuleMutations<Log> {
  log: (message: string, options: LogOptions) => void;
  findLogs: (params: {
    limit: number;
    offset: number;
    sort?: Sort;
  }) => Promise<Array<Log>>;

  count: () => Promise<number>;
}
