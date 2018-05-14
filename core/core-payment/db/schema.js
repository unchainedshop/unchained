import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { PaymentProviders } from './collections';

export const PaymentProviderType = { // eslint-disable-line
  CARD: 'CARD',
  INVOICE: 'INVOICE',
  POSTFINANCE: 'POSTFINANCE',
  PAYPAL: 'PAYPAL',
  CRYPTO: 'CRYPTO',
};

PaymentProviders.attachSchema(new SimpleSchema({
  type: { type: String, required: true, index: true },
  adapterKey: { type: String, required: true },
  configuration: { type: Array },
  'configuration.$': { type: Object },
  'configuration.$.key': { type: String },
  'configuration.$.value': { type: String },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));
