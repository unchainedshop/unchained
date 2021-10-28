import { createLogger as createWinstonLogger, format, transports } from 'winston';
import stringify from 'safe-stable-stringify';
import { LogLevel } from './LogLevel';
import TransportStream from 'winston-transport';

const {
  DEBUG = '',
  LOG_LEVEL = LogLevel.Info,
  UNCHAINED_LOG_FORMAT = 'unchained',
} = process.env;

const { combine, label, timestamp, colorize, printf, json } = format;

const debugStringContainsModule = (debugString: string, moduleName: string) => {
  const loggingMatched = debugString.split(',').reduce((accumulator: any, name: string) => {
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
    const otherPropsString = stringify(rest);
    return `${_timestamp} [${_label}] ${level}: ${message} ${otherPropsString}`;
  }
);

const UnchainedLogFormats = {
  unchained: (moduleName: string) =>
    combine(timestamp(), label({ label: moduleName }), colorize(), myFormat),
  json,
};

if (!UnchainedLogFormats[UNCHAINED_LOG_FORMAT.toLowerCase()]) {
  throw new Error(
    `UNCHAINED_LOG_FORMAT is invalid, use one of ${Object.keys(
      UnchainedLogFormats
    ).join(',')}`
  );
}

export { transports, format };

export const createLogger = (moduleName: string, moreTransports: Array<TransportStream> = []) => {
  const loggingMatched = debugStringContainsModule(DEBUG, moduleName);
  return createWinstonLogger({
    transports: [
      new transports.Console({
        format: UnchainedLogFormats[UNCHAINED_LOG_FORMAT](moduleName),
        stderrLevels: [LogLevel.Error],
        consoleWarnLevels: [LogLevel.Warning],
        level: loggingMatched ? LogLevel.Debug : LOG_LEVEL,
      }),
      ...moreTransports,
    ],
  });
};
