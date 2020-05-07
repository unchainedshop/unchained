// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import './db/factories';
import './db/helpers';
import LocalTransport from './local-transport';
import { Logs } from './db/collections';
import configureSchema from './db/schema';
import createLogger, { transports, format } from './createLogger';

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

export { Logger, log, Logs, createLogger, transports, format };
