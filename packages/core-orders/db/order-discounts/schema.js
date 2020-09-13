import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
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

OrderDiscounts.rawCollection().createIndex({ orderId: 1 });
OrderDiscounts.rawCollection().createIndex({ trigger: 1 });

export default OrderDiscountTrigger;
