import winston from 'winston';
import { LogLevel, LogOptions } from './logger.types.js';
import { createLogger } from './createLogger.js';

const logger = createLogger('unchained');

export const log = (message: string | Error, options?: LogOptions): winston.Logger => {
  if (!options?.level) {
    return logger.info(message as any, options);
  }
  const { level = LogLevel.Info, ...meta } = options || {};
  return logger.log(level, message as any, meta);
};
