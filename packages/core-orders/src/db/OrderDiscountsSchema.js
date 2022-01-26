import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const OrderDiscountsSchema = new SimpleSchema(
  {
    orderId: String,
    code: String,
    trigger: { type: String, required: true },
    discountKey: { type: String, required: true },
    reservation: { type: Object, blackbox: true },
    ...Schemas.contextFields,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
