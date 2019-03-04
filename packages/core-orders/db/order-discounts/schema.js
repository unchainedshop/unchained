import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { OrderDiscounts } from './collections';

export const OrderDiscountTrigger = {
  USER: 'USER',
  SYSTEM: 'SYSTEM'
};

OrderDiscounts.attachSchema(
  new SimpleSchema(
    {
      orderId: { type: String, index: true },
      code: String,
      trigger: { type: String, index: true, required: true },
      discountKey: { type: String, required: true },
      ...Schemas.timestampFields
    },
    { requiredByDefault: false }
  )
);

export default OrderDiscountTrigger;
