// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import './db/factories';
import './db/helpers';
import LocalTransport from './local-transport';
import { Logs } from './db/collections';
import runMigrations from './db/schema';
import createLogger from './createLogger';

let instance = null;
class Logger {
  constructor() {
    if (!instance) {
      instance = this;
    }
    const transports = !process.env.LOG_DISABLE_DB_LOGGER
      ? [new LocalTransport({ level: 'info' })]
      : [];
    this.winston = createLogger('unchained', transports);
    return instance;
  }
}

const log = (message, options) => {
  const { level = 'info', ...meta } = options || {};
  return new Logger().winston.log(level, message, meta);
};

export default () => {
  runMigrations();
};

export { Logger, log, Logs, createLogger };
