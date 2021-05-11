import { registerEvents } from 'meteor/unchained:core-events';
import runMigrations from './db/schema';

export * from './db';

export default () => {
  runMigrations();
  registerEvents(['LANGUAGE_CREATE', 'LANGUAGE_UPDATE', 'LANGUAGE_REMOVE']);
};
