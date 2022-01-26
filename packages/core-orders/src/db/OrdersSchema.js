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
    billingAddress: Schemas.Address,
    confirmed: Date,
    contact: Schemas.Contact,
    countryCode: String,
    currency: String,
    deliveryId: String,
    fullfilled: Date,
    ordered: Date,
    orderNumber: String,
    originEnrollmentId: String,
    paymentId: String,
    status: String,
    userId: String,
    ...calculationFields,
    ...Schemas.contextFields,
    ...Schemas.logFields,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
