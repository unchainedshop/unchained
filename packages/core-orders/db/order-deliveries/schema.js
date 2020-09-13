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
    { requiredByDefault: false },
  ),
);

OrderDeliveries.rawCollection().createIndex({ orderId: 1 });

export default OrderDeliveryStatus;
