import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { PaymentProviders } from './collections';
import { PaymentProviderType } from './schema';

Factory.define('paymentProvider', PaymentProviders, {
  adapterKey: () => 'ch.dagobert.invoice',
  type: () => PaymentProviderType.INVOICE,
  configuration: () => [],
  ...fakeTimestampFields,
});
