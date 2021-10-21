import { LoggerOptions } from 'winston';
import { TimestampFields, Update } from './common';

export enum LogLevel {
  Info = 'info',
  Debug = 'debug',
  Error = 'error',
  Warning = 'warning',
}

export type Log = {
  level: LogLevel;
  message: string;
  meta?: object;
} & TimestampFields;

export interface LogOptions extends LoggerOptions {
  level: LogLevel;
}

export declare interface LogsModule {
  log: (message: string, options: LogOptions) => void;
  findLogs: (params: {
    limit: number;
    offset: number;
    sort?: object;
  }) => Promise<Array<Log>>;

  count: () => Promise<number>;

  insert: (doc: Log) => Promise<string>;
  update: (eventId: string, doc: Update<Log>) => Promise<void>;
  remove: (eventId: string) => Promise<void>;
}

declare module 'meteor/unchained:core-logger' {
  function log(message: string, options?: LogOptions): void;
  function createLogger(moduleName: string): void;

  export { log, createLogger };
}
