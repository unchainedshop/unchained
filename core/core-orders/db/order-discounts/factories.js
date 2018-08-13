import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { fakeTimestampFields } from 'meteor/unchained:utils';
import { OrderDiscounts } from './collections';
import { OrderDiscountTrigger } from './schema';

Factory.define('systemOrderDiscount', OrderDiscounts, {
  orderId: () => Factory.get('order'),
  code: () => null,
  trigger: () => OrderDiscountTrigger.SYSTEM,
  discountKey: () => faker.random.arrayElement(['ch.dagobert.coupon.distributor']),
  ...fakeTimestampFields,
});
