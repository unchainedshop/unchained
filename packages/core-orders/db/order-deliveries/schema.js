import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
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

OrderDeliveries.attachSchema(new SimpleSchema({
  orderId: { type: String, index: true },
  deliveryProviderId: String,
  delivered: Date,
  status: String,
  ...timestampFields,
  ...contextFields,
  ...calculationFields,
  ...logFields,
}, { requiredByDefault: false }));

export default OrderDeliveryStatus;
