import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const PaymentCredentialsSchema = new SimpleSchema(
  {
    paymentProviderId: { type: String, required: true },
    userId: { type: String, required: true },
    token: String,
    isPreferred: Boolean,
    meta: { type: Object, blackbox: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false }
);
