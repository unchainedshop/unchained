import { createLogger, format, transports } from 'winston';
import util from 'util';

const { DEBUG = '', LOG_LEVEL = 'info' } = process.env;
const { combine, label, timestamp, colorize, printf } = format;

const debugStringContainsModule = (debugString, moduleName) => {
  const loggingMatched = debugString.split(',').reduce((accumulator, name) => {
    if (accumulator === false) return accumulator;
    const nameRegex = name
      .replace('-', '\\-?')
      .replace(':*', '\\:?*')
      .replace('*', '.*');
    const regExp = new RegExp(`^${nameRegex}$`, 'm');
    if (regExp.test(moduleName)) {
      if (name.slice(0, 1) === '-') {
        // explicitly disable
        return false;
      }
      return true;
    }
    return accumulator;
  }, undefined);
  return loggingMatched || false;
};

const myFormat = printf(
  ({ level, message, label: _label, timestamp: _timestamp, ...rest }) => {
    const otherProps = JSON.parse(JSON.stringify(rest));
    const otherPropsString = Object.keys(otherProps).length
      ? util.inspect(otherProps, {
          colors: true
        })
      : '';
    return `${_timestamp} [${_label}] ${level}: ${message} ${otherPropsString}`;
  }
);

export default (moduleName, moreTransports = []) => {
  const loggingMatched = debugStringContainsModule(DEBUG, moduleName);
  return createLogger({
    format: combine(
      timestamp(),
      label({ label: moduleName }),
      colorize(),
      myFormat
    ),
    transports: [
      new transports.Console({
        stderrLevels: ['error'],
        consoleWarnLevels: ['warn'],
        level: loggingMatched ? 'debug' : LOG_LEVEL
      }),
      ...moreTransports
    ]
  });
};
