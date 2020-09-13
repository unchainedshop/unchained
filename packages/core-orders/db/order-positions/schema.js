import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { OrderPositions } from './collections';

const { contextFields, timestampFields } = Schemas;

const calculationFields = {
  calculation: Array,
  'calculation.$': {
    type: Object,
    blackbox: true,
  },
  scheduling: Array,
  'scheduling.$': {
    type: Object,
    blackbox: true,
  },
  configuration: Array,
  'configuration.$': {
    type: Object,
    required: true,
  },
  'configuration.$.key': {
    type: String,
    required: true,
  },
  'configuration.$.value': {
    type: String,
  },
};

OrderPositions.attachSchema(
  new SimpleSchema(
    {
      productId: String,
      orderId: String,
      originalProductId: { type: String },
      quotationId: { type: String },
      quantity: Number,
      ...timestampFields,
      ...contextFields,
      ...calculationFields,
    },
    { requiredByDefault: false },
  ),
);

OrderPositions.rawCollection().createIndex({ productId: 1 });
OrderPositions.rawCollection().createIndex({ orderId: 1 });
