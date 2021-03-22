import { registerEvent } from 'meteor/unchained:core-events';
import { Orders } from './db/orders';
import runMigrations from './db/migrations';

export * from './db/order-deliveries';
export * from './db/order-discounts';
export * from './db/order-documents';
export * from './db/order-payments';
export * from './db/order-positions';
export * from './db/orders';
const ORDER_EVENTS = [
  'ORDER_ADD_PRODUCT',
  'ORDER_ADD_DISCOUNT',
  'ORDER_CHECKOUT',
  'ORDER_CONFIRMED',
  'ORDER_FULLFILED',
  'ORDER_UPDATE_DELIVERY',
  'ORDER_UPDATE_PAYMENT',
  'ORDER_SIGN_PAYMENT',
  'ORDER_REMOVE',
  'ORDER_DELIVER',
  'ORDER_PAY',
];

export default () => {
  // configure
  Orders.invalidateProviders();
  runMigrations();
  registerEvent(ORDER_EVENTS);
};
