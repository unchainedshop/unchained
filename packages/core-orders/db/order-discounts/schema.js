import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';

import { OrderDiscounts } from './collections';

const { contextFields, timestampFields } = Schemas;

export const OrderDiscountTrigger = {
  USER: 'USER',
  SYSTEM: 'SYSTEM',
};

OrderDiscounts.attachSchema(
  new SimpleSchema(
    {
      orderId: String,
      code: String,
      trigger: { type: String, required: true },
      discountKey: { type: String, required: true },
      reservation: { type: Object, blackbox: true },
      ...contextFields,
      ...timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Migrations.add({
  version: 20200914.8,
  name: 'drop OrderDiscount related indexes',
  up() {
    OrderDiscounts.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  OrderDiscounts.rawCollection().createIndex({ orderId: 1 });
  OrderDiscounts.rawCollection().createIndex({ trigger: 1 });
};
