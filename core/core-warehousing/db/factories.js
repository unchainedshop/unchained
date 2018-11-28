import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { WarehousingProviders } from './collections';
import { WarehousingProviderType } from './schema';

Factory.define('warehousingProvider', WarehousingProviders, {
  adapterKey: () => 'shop.unchained.warehousing.manual-stock',
  type: () => WarehousingProviderType.PHYSICAL,
  configuration: () => [],
  ...fakeTimestampFields,
});
