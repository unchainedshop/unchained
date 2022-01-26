import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

const calculationFields = {
  calculation: Array,
  'calculation.$': {
    type: Object,
    blackbox: true,
  },
};

export const OrderPaymentsSchema = new SimpleSchema(
  {
    orderId: String,
    paymentProviderId: String,
    paid: Date,
    status: String,
    ...calculationFields,
    ...Schemas.contextFields,
    ...Schemas.logFields,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
