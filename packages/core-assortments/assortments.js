import './db/factories';
import runMigrations from './db/schema';
import settings from './settings';

export * from './db/helpers';
export * from './db/collections';
export default (options) => {
  // configure
  settings.load(options);
  runMigrations();
};
