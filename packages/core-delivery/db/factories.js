import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { DeliveryProviders } from './collections';
import { DeliveryProviderType } from './schema';

Factory.define('deliveryProvider', DeliveryProviders, {
  adapterKey: () => 'shop.unchained.delivery.send-message',
  type: () => DeliveryProviderType.SHIPPING,
  configuration: () => [],
  authorId: () => Factory.get('user'),
  ...fakeTimestampFields,
});
