import { LogOptions } from 'unchained-core-types'

declare module 'meteor/unchained:core-logger' {
  function log(message: string, options?: LogOptions): void;
  function createLogger(moduleName: string): void;

  export { log, createLogger };
}
