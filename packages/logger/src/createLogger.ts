import { stringify } from 'safe-stable-stringify';
import { default as log } from 'loglevel';
import { LogLevel } from './logger.types.js';
import { default as prefix } from 'loglevel-plugin-prefix';
import chalk, { ChalkInstance } from 'chalk';

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

const colors: Record<string, ChalkInstance> = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
};

const invertedLevels = Object.fromEntries(
  Object.entries(log.levels).map(([key, value]) => [value, key]),
);

const SUPPORTED_LOG_FORMATS = ['json', 'unchained'];

// Track if we've initialized the logger format already
let isLoggerInitialized = false;

const initializeLogger = (logFormat: string) => {
  if (isLoggerInitialized) return;

  if (!SUPPORTED_LOG_FORMATS.includes(logFormat.toLowerCase())) {
    throw new Error(`UNCHAINED_LOG_FORMAT is invalid, use one of ${SUPPORTED_LOG_FORMATS.join(',')}`);
  }

  if (logFormat.toLowerCase() === 'unchained') {
    prefix.reg(log);
    prefix.apply(log, {
      format: (level, name, timestamp) =>
        `${chalk.gray(`${timestamp}`)} [${chalk.green(`${name}] ${colors[level.toUpperCase()](level)}:`)}`,
    });
  } else if (logFormat.toLowerCase() === 'json') {
    const originalFactory = log.methodFactory;
    log.methodFactory = function (methodName, logLevel, loggerName) {
      const rawMethod = originalFactory(methodName, logLevel, loggerName);
      const level = invertedLevels[logLevel];
      const name = loggerName || 'unchained';

      return function (message, meta) {
        rawMethod(
          stringify({
            timestamp: new Date(),
            level,
            name,
            message,
            ...meta,
          }),
        );
      };
    };
    log.rebuild();
  }

  isLoggerInitialized = true;
};

// Export for testing purposes only
export const resetLoggerInitialization = () => {
  isLoggerInitialized = false;
};

export const createLogger = (moduleName: string) => {
  // Get environment variables inside the function
  const { DEBUG = '', LOG_LEVEL = LogLevel.Info, UNCHAINED_LOG_FORMAT = 'unchained' } = process.env;

  // Initialize logger format on first use
  initializeLogger(UNCHAINED_LOG_FORMAT);

  const loggingMatched = debugStringContainsModule(DEBUG, moduleName);
  const logger = log.getLogger(moduleName);

  const logLevelMap: Record<string, log.LogLevelDesc> = {
    [LogLevel.Debug]: log.levels.DEBUG,
    [LogLevel.Info]: log.levels.INFO,
    [LogLevel.Warning]: log.levels.WARN,
    [LogLevel.Error]: log.levels.ERROR,
    [LogLevel.Verbose]: log.levels.TRACE,
  };

  logger.setDefaultLevel(loggingMatched ? log.levels.DEBUG : logLevelMap[LOG_LEVEL.toLowerCase()]);
  return logger;
};
