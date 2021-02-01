import runMigrations from './db/schema';
import './db/helpers';
import settings from './settings';

export * from './db/schema';
export * from './db/collections';
export default (options) => {
  settings.load(options);
  runMigrations();
};
