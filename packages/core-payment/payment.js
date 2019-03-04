import './db/factories';
import './db/helpers';
import runMigrations from './db/schema';

export * from './db/schema';
export * from './db/collections';
export * from './director';
export default () => {
  // configure
  runMigrations();
};
