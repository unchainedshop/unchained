import winston from 'winston';
import { LogLevel, LogOptions } from './logger.types.js';
import { createLogger } from './createLogger.js';

const logger = createLogger('unchained');

export const log = (message: string, options?: LogOptions): winston.Logger => {
  const { level = LogLevel.Info, ...meta } = options || {};
  return logger.log(level, message, meta);
};
