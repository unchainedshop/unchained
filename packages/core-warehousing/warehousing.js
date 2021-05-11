import { registerEvents } from 'meteor/unchained:core-events';
import runMigrations from './db/schema';

export * from './db';
export * from './director';
export default () => {
  runMigrations();
  registerEvents([
    'WAREHOUSING_PROVIDER_CREATE',
    'WAREHOUSING_PROVIDER_UPDATE',
    'WAREHOUSING_PROVIDER_REMOVE',
  ]);
};
