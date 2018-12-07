import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { DeliveryProviders } from './collections';
import { DeliveryProviderType } from './schema';

Factory.define('deliveryProvider', DeliveryProviders, {
  adapterKey: () => 'ch.freezyboy.email-delegation',
  type: () => DeliveryProviderType.SHIPPING,
  configuration: () => [],
  ...fakeTimestampFields,
});
