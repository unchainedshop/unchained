import { LoggerOptions } from 'winston';
import { TimestampFields } from './common';

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
}

declare module 'meteor/unchained:core-logger' {
  function log(message: string, options?: LogOptions): void;
  function createLogger(moduleName: string): void;

  export { log, createLogger };
}
