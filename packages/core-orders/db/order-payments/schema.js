import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';

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
    { requiredByDefault: false },
  ),
);

OrderPayments.rawCollection().createIndex({ orderId: 1 });

Migrations.add({
  version: 20200914.9,
  name: 'drop OrderPayments related indexes',
  up() {
    OrderPayments.rawCollection().dropIndexes();
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  OrderPayments.rawCollection().createIndex({ orderId: 1 });
};
