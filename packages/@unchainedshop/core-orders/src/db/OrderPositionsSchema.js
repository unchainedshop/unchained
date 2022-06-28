import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

const calculationFields = {
  calculation: Array,
  'calculation.$': {
    type: Object,
    blackbox: true,
  },
  scheduling: Array,
  'scheduling.$': {
    type: Object,
    blackbox: true,
  },
};

export const OrderPositionsSchema = new SimpleSchema(
  {
    productId: String,
    orderId: String,
    originalProductId: { type: String },
    quotationId: { type: String },
    quantity: Number,
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
    ...calculationFields,
    ...Schemas.contextFields,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
