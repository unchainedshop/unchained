import { inspect } from 'node:util';
import { stringify } from 'safe-stable-stringify';
import { LogLevel } from './logger.types.js';

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

// ANSI color codes
const colors = {
  gray: '\x1b[90m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
};

// Log level configuration
enum LogLevelValue {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

const logLevelMap: Record<string, LogLevelValue> = {
  [LogLevel.Verbose]: LogLevelValue.TRACE,
  [LogLevel.Debug]: LogLevelValue.DEBUG,
  [LogLevel.Info]: LogLevelValue.INFO,
  [LogLevel.Warning]: LogLevelValue.WARN,
  [LogLevel.Error]: LogLevelValue.ERROR,
  // Add trace as an alias for verbose
  trace: LogLevelValue.TRACE,
};

const levelColors: Record<string, string> = {
  trace: colors.magenta,
  debug: colors.cyan,
  info: colors.blue,
  warn: colors.yellow,
  error: colors.red,
};

export interface Logger {
  trace: (message: any, ...args: any[]) => void;
  debug: (message: any, ...args: any[]) => void;
  info: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
}

const formatTimestamp = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Custom replacer for BigInt values
const bigintReplacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Reset function for tests - current implementation doesn't maintain global state
export const resetLoggerInitialization = (): void => {
  // No-op function for compatibility with tests
  // The current implementation doesn't maintain any global state that needs resetting
};

export const createLogger = (moduleName: string): Logger => {
  const { DEBUG = '', LOG_LEVEL = LogLevel.Info, UNCHAINED_LOG_FORMAT = 'unchained' } = process.env;

  // Validate format at logger creation time
  const format = UNCHAINED_LOG_FORMAT.toLowerCase();
  if (format !== 'json' && format !== 'unchained') {
    throw new Error(`UNCHAINED_LOG_FORMAT is invalid, use one of json,unchained`);
  }

  const loggingMatched = debugStringContainsModule(DEBUG, moduleName);
  const logLevelLower = LOG_LEVEL.toLowerCase();
  const mappedLevel = logLevelMap[logLevelLower];
  const minLevel = loggingMatched
    ? LogLevelValue.DEBUG
    : mappedLevel !== undefined
      ? mappedLevel
      : LogLevelValue.INFO;

  // Create a no-op function for better performance when logging is disabled
  const noop = () => {
    // Intentionally empty for performance
  };

  const log = (level: string, levelValue: LogLevelValue, message: any, ...args: any[]) => {
    if (levelValue < minLevel) return;

    if (format === 'json') {
      // JSON format
      const logObject: any = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        name: moduleName,
        message: typeof message === 'string' ? message : message,
      };

      // Merge additional args if they're objects
      if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
        Object.assign(logObject, args[0]);
      }

      // Use safe-stable-stringify for proper JSON output with BigInt support
      console.log(stringify(logObject, bigintReplacer));
    } else {
      // Unchained format (pretty)
      const timestamp = formatTimestamp();
      const levelColor = levelColors[level] || colors.reset;
      const prefix = `${colors.gray}${timestamp}${colors.reset} [${colors.green}${moduleName}${colors.reset}] ${levelColor}${level}:${colors.reset}`;

      if (typeof message === 'string') {
        console.log(prefix, message, ...args);
      } else {
        console.log(prefix, inspect(message, { colors: true, depth: 3 }), ...args);
      }
    }
  };

  return {
    trace:
      LogLevelValue.TRACE < minLevel
        ? noop
        : (message: any, ...args: any[]) => log('trace', LogLevelValue.TRACE, message, ...args),
    debug:
      LogLevelValue.DEBUG < minLevel
        ? noop
        : (message: any, ...args: any[]) => log('debug', LogLevelValue.DEBUG, message, ...args),
    info:
      LogLevelValue.INFO < minLevel
        ? noop
        : (message: any, ...args: any[]) => log('info', LogLevelValue.INFO, message, ...args),
    warn:
      LogLevelValue.WARN < minLevel
        ? noop
        : (message: any, ...args: any[]) => log('warn', LogLevelValue.WARN, message, ...args),
    error:
      LogLevelValue.ERROR < minLevel
        ? noop
        : (message: any, ...args: any[]) => log('error', LogLevelValue.ERROR, message, ...args),
  };
};
