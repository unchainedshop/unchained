import { LoggerOptions } from 'winston';

export { format, transports } from 'winston';

export enum LogLevel {
  Verbose = 'verbose',
  Info = 'info',
  Debug = 'debug',
  Error = 'error',
  Warning = 'warn',
}

export interface LogOptions extends LoggerOptions {
  level?: LogLevel;
  [x: string]: any;
}

export enum SupportedLogFormats {
  'unchained',
  'json',
}
