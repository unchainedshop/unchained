import runMigrations from './db/schema';
import settings from './settings';

export * from './db';
export * from './director';

export default (options) => {
  settings.load(options);
  runMigrations();
};
