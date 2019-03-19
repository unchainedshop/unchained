import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { fakeTimestampFields } from 'meteor/unchained:utils';
import { OrderPayments } from './collections';
import { OrderPaymentStatus } from './schema';

Factory.define('orderPayment', OrderPayments, {
  orderId: () => Factory.get('order'),
  paymentProviderId: () => Factory.get('paymentProvider'),
  status: () => faker.random.arrayElement(OrderPaymentStatus),
  context: () => ({}),
  ...fakeTimestampFields
});
