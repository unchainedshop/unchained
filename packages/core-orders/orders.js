import { registerEvents } from 'meteor/unchained:core-events';
import runMigrations from './db/migrations';
import settings from './settings';

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
  'ORDER_FULLFILLED',
  'ORDER_UPDATE_DELIVERY',
  'ORDER_UPDATE_PAYMENT',
  'ORDER_SIGN_PAYMENT',
  'ORDER_REMOVE',
  'ORDER_CREATE',
  'ORDER_UPDATE',
  'ORDER_SET_PAYMENT_PROVIDER',
  'ORDER_SET_DELIVERY_PROVIDER',
  'ORDER_EMPTY_CART',
  'ORDER_UPDATE_CART_ITEM',
  'ORDER_REMOVE_CART_ITEM',
  'ORDER_UPDATE_DISCOUNT',
  'ORDER_REMOVE_DISCOUNT',
  'ORDER_DELIVER',
  'ORDER_PAY',
];

export default (options) => {
  settings.load(options);
  runMigrations();
  registerEvents(ORDER_EVENTS);
};
