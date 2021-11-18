import { registerEvents } from 'unchained-events';
import runMigrations from './db/schema';
import settings from './settings';

export * from './db';
export * from './director';

export default (options) => {
  settings.load(options);
  runMigrations();
  registerEvents([
    'DELIVERY_PROVIDER_CREATE',
    'DELIVERY_PROVIDER_UPDATE',
    'DELIVERY_PROVIDER_REMOVE',
  ]);
};
