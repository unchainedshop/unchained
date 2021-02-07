import runMigrations from './db/migrations';
import settings from './settings';

export * from './db/order-deliveries';
export * from './db/order-discounts';
export * from './db/order-documents';
export * from './db/order-payments';
export * from './db/order-positions';
export * from './db/orders';
export * from './events';

export default (options) => {
  settings.load(options);
  runMigrations();
};
