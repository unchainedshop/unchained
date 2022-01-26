import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const PaymentProvidersSchema = new SimpleSchema(
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
  { requiredByDefault: false },
);
