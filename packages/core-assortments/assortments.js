import './db/factories';
import runMigrations from './db/schema';
import settings from './settings';

export * from './db/helpers';
export * from './db/collections';
export default (options) => {
  settings.load(options);
  runMigrations();
};
