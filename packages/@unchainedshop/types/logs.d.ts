import { Logger, LoggerOptions } from 'winston';
import TransportStream from 'winston-transport';
import { TimestampFields, _ID } from './common';

export { format, transports } from 'winston';

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

export type log = (message: string, options?: LogOptions) => void;
export type createLogger = (
  moduleName: string,
  moreTransports?: Array<TransportStream>
) => Logger;
