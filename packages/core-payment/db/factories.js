import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { PaymentProviders } from './collections';
import { PaymentProviderType } from './schema';

Factory.define('paymentProvider', PaymentProviders, {
  adapterKey: () => 'shop.unchained.invoice',
  type: () => PaymentProviderType.INVOICE,
  configuration: () => [],
  authorId: () => Factory.get('user'),
  ...fakeTimestampFields
});
