import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';

import { OrderDeliveries } from './collections';

const { logFields, contextFields, timestampFields } = Schemas;

const calculationFields = {
  calculation: Array,
  'calculation.$': {
    type: Object,
    blackbox: true,
  },
};

export const OrderDeliveryStatus = {
  OPEN: null,
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
};

OrderDeliveries.attachSchema(
  new SimpleSchema(
    {
      orderId: String,
      deliveryProviderId: String,
      delivered: Date,
      status: String,
      ...timestampFields,
      ...contextFields,
      ...calculationFields,
      ...logFields,
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20200914.7,
  name: 'drop OrderDeliveries related indexes',
  up() {
    OrderDeliveries.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  OrderDeliveries.rawCollection().createIndex({ orderId: 1 });
};
