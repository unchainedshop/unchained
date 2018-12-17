// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import './db/factories';
import './db/helpers';
import LocalTransport from './local-transport';
import { Logs } from './db/collections';
import runMigrations from './db/schema';

const { createLogger, format, transports } = require('winston');

const { DEBUG } = process.env;
const {
  combine, colorize, printf,
} = format;

let instance = null;
class Logger {
  constructor(debug) {
    if (!instance) {
      instance = this;
    }
    this.winston = createLogger({
      format: combine(
        colorize(),
        printf(nfo => `${nfo.level}: ${nfo.message}`),
      ),
      transports: [
        new transports.Console({ level: debug ? 'debug' : 'info' }),
        new LocalTransport({ db: Logs }),
      ],
    });
    return instance;
  }
}

const log = (message, options) => {
  const { level = 'info', ...meta } = options || {};
  return (new Logger(DEBUG)).winston.log(level, message, meta);
};

export default () => {
  runMigrations();
};

export {
  Logger,
  log,
  Logs,
};
