import { fakeTimestampFields, fakeAddress } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { OrderDeliveries } from './collections';
import { OrderDeliveryStatus } from './schema';

Factory.define('orderDelivery', OrderDeliveries, {
  orderId: () => Factory.get('order'),
  deliveryProviderId: () => Factory.get('deliveryProvider'),
  status: () => faker.random.arrayElement(OrderDeliveryStatus),
  context: () => ({
    address: fakeAddress(),
  }),
  ...fakeTimestampFields,
});
