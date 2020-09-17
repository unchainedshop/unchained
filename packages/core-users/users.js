import './db/factories';
import runMigrations from './db/schema';
import './db/helpers';
import patchAccounts from './patch-accounts';

export * from './db/schema';
export * from './db/collections';
export default () => {
  runMigrations();
  patchAccounts();
};
