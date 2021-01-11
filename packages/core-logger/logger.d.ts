declare module 'meteor/unchained:core-logger' {
  type Level = 'info' | 'debug' | 'error' | 'warning';
  type Options = {
    level?: Level;
    [key: string]: any;
  };

  function log(message: string, options?: Options): void;

  // eslint-disable-next-line import/prefer-default-export
  export { log };
}
