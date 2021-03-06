import { registerEvents } from 'meteor/unchained:core-events';
import runMigrations from './db/schema';

export * from './db';

export default () => {
  runMigrations();
  registerEvents(['COUNTRY_CREATE', 'COUNTRY_UPDATE', 'COUNTRY_REMOVE']);
};
