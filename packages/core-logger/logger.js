// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import LocalTransport from './local-transport';

export * from './db';

const { createLogger, format, transports } = require('winston');

const { DEBUG } = process.env;
const { combine, colorize, printf } = format;

let instance = null;

export class Logger {
  constructor(debug) {
    if (!instance) {
      instance = this;
    }
    this.winston = createLogger({
      format: combine(
        colorize(),
        printf(nfo => `${nfo.level}: ${nfo.message}`)
      ),
      transports: [
        new transports.Console({ level: debug ? 'debug' : 'info' }),
        new LocalTransport({ level: 'info' })
      ]
    });
    return instance;
  }
}

export const log = (message, options) => {
  const { level = 'info', ...meta } = options || {};
  return new Logger(DEBUG).winston.log(level, message, meta);
};

export default () => {
  // configure
};
