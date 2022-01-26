import settings from './src/accounts-settings';

export * from './src/accounts/utils/helpers';
export * from './src/accounts/db-manager';
export * from './accounts-server';
export * from './src/accounts/accounts-password';
export default (options) => {
  settings.load(options);
};
