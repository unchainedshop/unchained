import './db/factories';
import './db/helpers';
import runMigrations from './db/schema';
import settings from './settings';

export * from './db/schema';
export * from './db/collections';
export * from './director';

export default (options) => {
  // configure
  settings.load(options);
  runMigrations();
};
