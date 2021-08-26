import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

import { OrderPayments } from './collections';

const { logFields, contextFields, timestampFields } = Schemas;

export const OrderPaymentStatus = {
  OPEN: null,
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
};

const calculationFields = {
  calculation: Array,
  'calculation.$': {
    type: Object,
    blackbox: true,
  },
};

OrderPayments.attachSchema(
  new SimpleSchema(
    {
      orderId: String,
      paymentProviderId: String,
      paid: Date,
      status: String,
      ...timestampFields,
      ...contextFields,
      ...calculationFields,
      ...logFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  OrderPayments.rawCollection().createIndex({ orderId: 1 });
};
