import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

const calculationFields = {
  calculation: Array,
  'calculation.$': {
    type: Object,
    blackbox: true,
  },
};

export const OrderDeliveriesSchema = new SimpleSchema(
  {
    delivered: Date,
    deliveryProviderId: String,
    orderId: String,
    status: String,
    ...calculationFields,
    ...Schemas.contextFields,
    ...Schemas.logFields,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false }
);
