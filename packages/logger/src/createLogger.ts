import { createRequire } from 'module';
import { createLogger as createWinstonLogger, format, transports } from 'winston';
import TransportStream from 'winston-transport';
import { LogLevel } from './logger.types.js';

const require = createRequire(import.meta.url);
const { stringify } = require('safe-stable-stringify');

const { DEBUG = '', LOG_LEVEL = LogLevel.Info, UNCHAINED_LOG_FORMAT = 'unchained' } = process.env;

const { combine, colorize, json } = format;

const debugStringContainsModule = (debugString: string, moduleName: string) => {
  if (!debugString) return false;
  const loggingMatched = debugString.split(',').reduce((accumulator: any, name: string) => {
    if (accumulator === false) return accumulator;
    const nameRegex = name.replace(/-/i, '\\-?').replace(/:\*/i, '\\:?*').replace(/\*/i, '.*');
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

const myFormat = format.printf(({ level, message, label, timestamp, stack, ...rest }) => {
  const otherPropsString: string = stringify(rest);
  return [
    `${timestamp} [${label}] ${level}:`,
    `${message}`,
    `${otherPropsString}`,
    stack ? `\n${stack}` : null,
  ]
    .filter(Boolean)
    .join(' ');
});

const UnchainedLogFormats = {
  unchained: combine(colorize(), myFormat),
  json: json(),
};

if (!UnchainedLogFormats[UNCHAINED_LOG_FORMAT.toLowerCase()]) {
  throw new Error(
    `UNCHAINED_LOG_FORMAT is invalid, use one of ${Object.keys(UnchainedLogFormats).join(',')}`,
  );
}

export { transports, format };

export const createLogger = (moduleName: string, moreTransports: Array<TransportStream> = []) => {
  const loggingMatched = debugStringContainsModule(DEBUG, moduleName);
  return createWinstonLogger({
    format: format.combine(
      format.errors({ stack: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' }),
      format.timestamp(),
      format.label({ label: moduleName }),
    ),
    transports: [
      new transports.Console({
        format: UnchainedLogFormats[UNCHAINED_LOG_FORMAT],
        stderrLevels: [LogLevel.Error],
        consoleWarnLevels: [LogLevel.Warning],
        level: loggingMatched ? LogLevel.Debug : LOG_LEVEL,
      }),
      ...moreTransports,
    ],
  });
};
