import settings from './settings';

export * from './helpers';
export * from './accounts-server';
export * from './accounts-password';
export default (options) => {
  settings.load(options);
};
