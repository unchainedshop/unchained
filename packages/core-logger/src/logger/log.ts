import winston from 'winston';
import { LogOptions } from 'unchained-core-types/logs';
import { Logger } from './Logger';
import { LogLevel } from './LogLevel';

export const log = (
  Logs: any,
  message: string,
  options: LogOptions
): winston.Logger => {
  const { level = LogLevel.Info, ...meta } = options || {};
  return new Logger(Logs).winston.log(level, message, meta);
};
