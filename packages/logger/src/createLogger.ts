import { inspect } from 'node:util';
import { stringify } from 'safe-stable-stringify';
import { LogLevel } from './logger.types.js';

// Cache for compiled regex patterns
const regexCache = new Map<string, RegExp>();

// Cache for debug pattern results
const debugPatternCache = new Map<string, boolean>();

const debugStringContainsModule = (debugString: string, moduleName: string) => {
  if (!debugString) return false;

  // Check cache first
  const cacheKey = `${debugString}::${moduleName}`;
  const cached = debugPatternCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const loggingMatched = debugString.split(',').reduce((accumulator: any, name: string) => {
    if (accumulator === false) return accumulator;

    // Check regex cache
    let regExp = regexCache.get(name);
    if (!regExp) {
      const nameRegex = name.replace(/-/i, '\\-?').replace(/:\*/i, '\\:?*').replace(/\*/i, '.*');
      regExp = new RegExp(`^${nameRegex}$`, 'm');
      regexCache.set(name, regExp);
    }

    if (regExp.test(moduleName)) {
      if (name.slice(0, 1) === '-') {
        // explicitly disable
        return false;
      }
      return true;
    }
    return accumulator;
  }, undefined);

  const result = loggingMatched || false;
  debugPatternCache.set(cacheKey, result);
  return result;
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

// Level colors are now used directly in makeLogFn

export interface Logger {
  trace: (message: any, ...args: any[]) => void;
  debug: (message: any, ...args: any[]) => void;
  info: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
}

// Optimized timestamp formatting - avoid string conversions
const formatTimestamp = () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

// Custom replacer for BigInt values
const bigintReplacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Reset function for tests - now clears caches
export const resetLoggerInitialization = (): void => {
  regexCache.clear();
  debugPatternCache.clear();
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
  
  // Pre-compute static parts for better performance
  const isJson = format === 'json';
  const grayCode = colors.gray;
  const resetCode = colors.reset;
  const greenCode = colors.green;
  const moduleColorized = `[${greenCode}${moduleName}${resetCode}]`;

  // Fast paths for JSON and unchained formats
  if (isJson) {
    // JSON format - inline functions for maximum performance
    return {
      trace: LogLevelValue.TRACE < minLevel ? noop : (message: any, ...args: any[]) => {
        const logObject: any = { timestamp: new Date().toISOString(), level: 'TRACE', name: moduleName, message };
        if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) Object.assign(logObject, args[0]);
        console.log(stringify(logObject, bigintReplacer));
      },
      debug: LogLevelValue.DEBUG < minLevel ? noop : (message: any, ...args: any[]) => {
        const logObject: any = { timestamp: new Date().toISOString(), level: 'DEBUG', name: moduleName, message };
        if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) Object.assign(logObject, args[0]);
        console.log(stringify(logObject, bigintReplacer));
      },
      info: LogLevelValue.INFO < minLevel ? noop : (message: any, ...args: any[]) => {
        const logObject: any = { timestamp: new Date().toISOString(), level: 'INFO', name: moduleName, message };
        if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) Object.assign(logObject, args[0]);
        console.log(stringify(logObject, bigintReplacer));
      },
      warn: LogLevelValue.WARN < minLevel ? noop : (message: any, ...args: any[]) => {
        const logObject: any = { timestamp: new Date().toISOString(), level: 'WARN', name: moduleName, message };
        if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) Object.assign(logObject, args[0]);
        console.log(stringify(logObject, bigintReplacer));
      },
      error: LogLevelValue.ERROR < minLevel ? noop : (message: any, ...args: any[]) => {
        const logObject: any = { timestamp: new Date().toISOString(), level: 'ERROR', name: moduleName, message };
        if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) Object.assign(logObject, args[0]);
        console.log(stringify(logObject, bigintReplacer));
      },
    };
  }

  // Unchained format - inline functions with pre-computed parts
  return {
    trace: LogLevelValue.TRACE < minLevel ? noop : (message: any, ...args: any[]) => {
      const prefix = `${grayCode}${formatTimestamp()}${resetCode} ${moduleColorized} ${colors.magenta}trace:${resetCode}`;
      typeof message === 'string' ? console.log(prefix, message, ...args) : console.log(prefix, inspect(message, { colors: true, depth: 3 }), ...args);
    },
    debug: LogLevelValue.DEBUG < minLevel ? noop : (message: any, ...args: any[]) => {
      const prefix = `${grayCode}${formatTimestamp()}${resetCode} ${moduleColorized} ${colors.cyan}debug:${resetCode}`;
      typeof message === 'string' ? console.log(prefix, message, ...args) : console.log(prefix, inspect(message, { colors: true, depth: 3 }), ...args);
    },
    info: LogLevelValue.INFO < minLevel ? noop : (message: any, ...args: any[]) => {
      const prefix = `${grayCode}${formatTimestamp()}${resetCode} ${moduleColorized} ${colors.blue}info:${resetCode}`;
      typeof message === 'string' ? console.log(prefix, message, ...args) : console.log(prefix, inspect(message, { colors: true, depth: 3 }), ...args);
    },
    warn: LogLevelValue.WARN < minLevel ? noop : (message: any, ...args: any[]) => {
      const prefix = `${grayCode}${formatTimestamp()}${resetCode} ${moduleColorized} ${colors.yellow}warn:${resetCode}`;
      typeof message === 'string' ? console.log(prefix, message, ...args) : console.log(prefix, inspect(message, { colors: true, depth: 3 }), ...args);
    },
    error: LogLevelValue.ERROR < minLevel ? noop : (message: any, ...args: any[]) => {
      const prefix = `${grayCode}${formatTimestamp()}${resetCode} ${moduleColorized} ${colors.red}error:${resetCode}`;
      typeof message === 'string' ? console.log(prefix, message, ...args) : console.log(prefix, inspect(message, { colors: true, depth: 3 }), ...args);
    },
  };
};
