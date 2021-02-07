import { OrderEvent } from './events';

declare module 'meteor/unchained:core-orders' {
  const Orders: any;

  const OrderEvents: OrderEvent;
  // eslint-disable-next-line import/prefer-default-export
  export { Orders, OrderEvents };
}
