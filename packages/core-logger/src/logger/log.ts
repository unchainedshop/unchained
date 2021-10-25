import { LogOptions } from 'unchained-core-types/lib/logs';
import { Logger } from './Logger';
import { LogLevel } from './LogLevel';

export const log = (Logs: any, message: string, options: LogOptions) => {
  const { level = LogLevel.Info, ...meta } = options || {};
  return new Logger(Logs).winston.log(level, message, meta);
};
