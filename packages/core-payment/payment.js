import { registerEvents } from 'meteor/unchained:director-events';
import runMigrations from './db/schema';
import settings from './settings';

export * from './db';
export * from './director';

export default (options) => {
  settings.load(options);
  runMigrations();
  registerEvents([
    'PAYMENT_PROVIDER_CREATE',
    'PAYMENT_PROVIDER_UPDATE',
    'PAYMENT_PROVIDER_REMOVE',
  ]);
};
