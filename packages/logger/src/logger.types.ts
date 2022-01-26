import { LoggerOptions } from 'winston';

export enum LogLevel {
  Verbose = 'verbose',
  Info = 'info',
  Debug = 'debug',
  Error = 'error',
  Warning = 'warn',
}

export interface LogOptions extends LoggerOptions {
  level: LogLevel;
}
