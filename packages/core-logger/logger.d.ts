declare module 'meteor/unchained:core-logger' {
  type Level = 'info' | 'debug' | 'error' | 'warning';
  type Options = {
    level?: Level;
    [key: string]: any;
  };

  function log(message: string, options?: Options): void;
  function createLogger(moduleName: string): any;

  // eslint-disable-next-line import/prefer-default-export
  export { log, createLogger };
}
