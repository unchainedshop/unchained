import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Quotations } from './collections';

const { logFields, contextFields, timestampFields } = Schemas;

export const QuotationStatus = {
  REQUESTED: null,
  PROCESSING: 'PROCESSING',
  PROPOSED: 'PROPOSED',
  FULLFILLED: 'FULLFILLED',
  REJECTED: 'REJECTED',
};

Quotations.attachSchema(new SimpleSchema({
  userId: { type: String, index: true },
  productId: { type: String, index: true },
  status: { type: String, index: true },
  fullfilled: Date,
  rejected: Date,
  ...timestampFields,
  ...contextFields,
  ...logFields,
}, { requiredByDefault: false }));

export default QuotationStatus;
