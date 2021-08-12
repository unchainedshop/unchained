/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: replace by appropriate object type when they are defined in there corresponsing module
import createIndexes from './db/schema';
import { Logs } from './db/collections';
import LocalTransport from './local-transport';
import createLogger, { transports, format } from './createLogger';

let instance;
class Logger {
  winston;

  constructor() {
    if (!instance) {
      instance = this;
    }
    const dbTransport = !process.env.LOG_DISABLE_DB_LOGGER
      ? [new LocalTransport({ level: 'info' })]
      : [];
    this.winston = createLogger('unchained', dbTransport);
    return instance;
  }
}

const log = (message: string, options: any): void => {
  const { level = 'info', ...meta } = options || {};
  return new Logger().winston.log(level, message, meta);
};

export { Logger, log, createLogger, transports, format, Logs };

export const services = {
  log,
  createLogger,
};

export type UnchainedLogs = {
  _id: string;
  level: string;
  message: string;
  user: any;
  order: any;
};

export type UnchainedLoggerAPI = {
  findLogs({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }): Promise<Array<UnchainedLogs>>;
};

// eslint-disable-next-line
export default (): UnchainedLoggerAPI => {
  createIndexes();
  return {
    findLogs: async ({ limit, offset }) =>
      Logs.find(
        {},
        {
          skip: offset,
          limit,
          sort: { created: -1 },
        }
      ).fetch(),
  };
};
