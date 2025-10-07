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

const SUPPORTED_LOG_FORMATS = ['json', 'unchained'];

let prefixApplied = false;

// Export for testing purposes only
export const resetLoggerInitialization = () => {
  // Reset all loggers
  const loggers = (log as any).getLoggers();
  Object.keys(loggers).forEach((name) => {
    delete loggers[name];
  });
  prefixApplied = false;
};

export const createLogger = (moduleName: string) => {
  // Get environment variables inside the function
  const { DEBUG = '', LOG_LEVEL = LogLevel.Info, UNCHAINED_LOG_FORMAT = 'unchained' } = process.env;

  if (!SUPPORTED_LOG_FORMATS.includes(UNCHAINED_LOG_FORMAT.toLowerCase())) {
    throw new Error(`UNCHAINED_LOG_FORMAT is invalid, use one of ${SUPPORTED_LOG_FORMATS.join(',')}`);
  }

  // Apply prefix formatting if needed (for unchained format)
  if (UNCHAINED_LOG_FORMAT !== 'json' && !prefixApplied) {
    prefix.reg(log);
    prefix.apply(log, {
      format: (level, name, timestamp) =>
        `${chalk.gray(`${timestamp}`)} [${chalk.green(`${name}] ${colors[level.toUpperCase()](level)}:`)}`,
    });
    prefixApplied = true;
  }

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

  // For JSON format, wrap all logger methods
  if (UNCHAINED_LOG_FORMAT.toLowerCase() === 'json') {
    ['trace', 'debug', 'info', 'warn', 'error'].forEach((method) => {
      (logger as any)[method] = function (message: string, meta?: any) {
        console.log(
          stringify(
            {
              timestamp: new Date(),
              level: method.toUpperCase(),
              name: moduleName,
              message,
              ...(meta || {}),
            },
            (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          ),
        );
      };
    });
  }

  return logger;
};
