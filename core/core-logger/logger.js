// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
const { createLogger, format, transports } = require('winston');
import './db/factories';
import './db/schema';
import initHelpers from './db/helpers';
import LocalTransport from './local-transport';
import { Logs } from './db/collections';

const { DEBUG } = process.env;
const { combine, timestamp, colorize, printf } = format;

let instance = null;
class Logger {
  constructor(debug) {
    if (!instance) {
      instance = this;
    }
    this.winston = createLogger({
      format: combine(
        colorize(),
        printf(nfo => {
          return `${nfo.level}: ${nfo.message}`;
        })
      ),
      transports: [
        new transports.Console({ level: debug ? 'verbose' : 'info' }),
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
  // configure
  initHelpers();
};

export {
  Logger,
  log,
  Logs,
};
