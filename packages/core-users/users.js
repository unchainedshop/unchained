import './db/factories';
import runMigrations from './db/schema';
import initHelpers from './db/helpers';

export * from './db/collections';
export default () => {
  // configure
  runMigrations();
  initHelpers();
};
