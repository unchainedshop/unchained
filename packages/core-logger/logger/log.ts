import { LogLevel } from 'unchained-core-types';
import { LoggerOptions } from 'winston';
import { Logger } from './Logger';

interface LogOptions extends LoggerOptions {
  level: LogLevel;
}

export const log = (message: string, options: LogOptions) => {
  const { level = LogLevel.Info, ...meta } = options || {};
  return new Logger().winston.log(level, message, meta);
};
