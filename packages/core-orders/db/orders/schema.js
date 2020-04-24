import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Orders } from './collections';

const { Address, Contact, contextFields, logFields, timestampFields } = Schemas;

export const OrderStatus = {
  OPEN: null,
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FULLFILLED: 'FULLFILLED',
};

const calculationFields = {
  calculation: Array,
  'calculation.$': {
    type: Object,
    blackbox: true,
  },
};

Orders.attachSchema(
  new SimpleSchema(
    {
      userId: { type: String, index: true },
      status: { type: String, index: true },
      orderNumber: { type: String, index: true, unique: true },
      ordered: Date,
      confirmed: Date,
      fullfilled: Date,
      billingAddress: Address,
      contact: Contact,
      currency: String,
      countryCode: String,
      paymentId: String,
      deliveryId: String,
      subscriptionId: String,
      ...contextFields,
      ...timestampFields,
      ...calculationFields,
      ...logFields,
    },
    { requiredByDefault: false }
  )
);

export default OrderStatus;
