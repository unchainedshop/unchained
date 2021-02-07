import { Orders } from './db/orders';
import runMigrations from './db/migrations';

export * from './db/order-deliveries';
export * from './db/order-discounts';
export * from './db/order-documents';
export * from './db/order-payments';
export * from './db/order-positions';
export * from './db/orders';
export * from './events';

export default () => {
  // configure
  Orders.invalidateProviders();
  runMigrations();
};
