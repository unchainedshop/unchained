import { LoggerOptions } from 'winston';

export enum LogLevel {
  Info = 'info',
  Debug = 'debug',
  Error = 'error',
  Warning = 'warning',
}

export interface Log {
  level: LogLevel;
  message: string;
  meta?: object;
}

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
