import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { DeliveryProviders } from './collections';
import { DeliveryProviderType } from './schema';

Factory.define('deliveryProvider', DeliveryProviders, {
  adapterKey: () => 'shop.unchained.send-mail',
  type: () => DeliveryProviderType.SHIPPING,
  configuration: () => [],
  ...fakeTimestampFields,
});
