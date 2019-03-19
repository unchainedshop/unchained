import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { fakeTimestampFields } from 'meteor/unchained:utils';
import { OrderPositions } from './collections';

Factory.define('orderPosition', OrderPositions, {
  productId: () => Factory.get('simpleProduct'),
  orderId: () => Factory.get('order'),
  quantity: () => faker.random.number({ min: 1, max: 3 }),
  ...fakeTimestampFields
});
