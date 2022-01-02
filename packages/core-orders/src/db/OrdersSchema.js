import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

const calculationFields = {
  calculation: Array,
  'calculation.$': {
    type: Object,
    blackbox: true,
  },
};

export const OrdersSchema = new SimpleSchema(
  {
    userId: String,
    status: String,
    orderNumber: String,
    ordered: Date,
    confirmed: Date,
    fullfilled: Date,
    billingAddress: Schemas.Address,
    contact: Schemas.Contact,
    currency: String,
    countryCode: String,
    paymentId: String,
    deliveryId: String,
    originEnrollmentId: String,
    ...calculationFields,
    ...Schemas.contextFields,
    ...Schemas.logFields,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false }
);
