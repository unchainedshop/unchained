import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

import { PaymentProviders, PaymentCredentials } from './collections';

export const PaymentProviderType = {
  // eslint-disable-line
  CARD: 'CARD',
  INVOICE: 'INVOICE',
  GENERIC: 'GENERIC',
};

PaymentProviders.attachSchema(
  new SimpleSchema(
    {
      type: { type: String, required: true },
      adapterKey: { type: String, required: true },
      authorId: { type: String, required: true },
      configuration: { type: Array },
      'configuration.$': { type: Object },
      'configuration.$.key': { type: String },
      'configuration.$.value': { type: String },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

PaymentCredentials.attachSchema(
  new SimpleSchema(
    {
      paymentProviderId: { type: String, required: true },
      userId: { type: String, required: true },
      token: String,
      isPreferred: Boolean,
      meta: { type: Object, blackbox: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  PaymentProviders.rawCollection().createIndex({ type: 1 });

  PaymentCredentials.rawCollection().createIndex({ paymentProviderId: 1 });
  PaymentCredentials.rawCollection().createIndex({ userId: 1 });
};
