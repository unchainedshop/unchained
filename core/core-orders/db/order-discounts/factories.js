import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { fakeTimestampFields } from 'meteor/unchained:utils';
import { OrderDiscounts, OrderDiscountTrigger } from './collections';

Factory.define('systemOrderDiscount', OrderDiscounts, {
  orderId: () => Factory.get('order'),
  code: () => null,
  trigger: () => OrderDiscountTrigger.System,
  discountKey: () => faker.random.arrayElement(['ch.dagobert.coupon.distributor']),
  ...fakeTimestampFields,
});
