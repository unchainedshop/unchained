import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const QuotationsSchema = new SimpleSchema(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    status: { type: String, required: true },
    quotationNumber: String,
    price: String,
    expires: Date,
    rejected: Date,
    meta: { type: Object, blackbox: true },
    fullfilled: Date,
    context: { type: Object, blackbox: true },
    currency: String,
    countryCode: String,
    configuration: Array,
    'configuration.$': {
      type: Object,
      required: true,
    },
    'configuration.$.key': {
      type: String,
      required: true,
    },
    'configuration.$.value': {
      type: String,
    },

    ...Schemas.logFields,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
