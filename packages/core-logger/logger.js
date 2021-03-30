import LocalTransport from './local-transport';
import configureSchema from './db/schema';
import createLogger, { transports, format } from './createLogger';

export * from './db';

let instance = null;
class Logger {
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

const log = (message, options) => {
  const { level = 'info', ...meta } = options || {};
  return new Logger().winston.log(level, message, meta);
};

export default () => {
  configureSchema();
};

export { Logger, log, createLogger, transports, format };
