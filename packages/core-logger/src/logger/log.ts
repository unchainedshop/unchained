import { LogLevel, LogOptions } from 'unchained-core-types';
import { Logger } from './Logger';


export const log = (Logs: any, message: string, options: LogOptions) => {
  const { level = LogLevel.Info, ...meta } = options || {};
  return new Logger(Logs).winston.log(level, message, meta);
};
