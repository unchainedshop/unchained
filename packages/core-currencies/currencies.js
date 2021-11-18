import { registerEvents } from 'meteor/unchained:events';
import runMigrations from './db/schema';

export * from './db';

export default () => {
  runMigrations();
  registerEvents(['CURRENCY_CREATE', 'CURRENCY_UPDATE', 'CURRENCY_REMOVE']);
};
