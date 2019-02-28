import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Quotations } from './collections';

const { logFields, contextFields, timestampFields } = Schemas;

export const QuotationStatus = {
  REQUESTED: null, // Request for Proposal
  PROCESSING: 'PROCESSING',
  PROPOSED: 'PROPOSED',
  FULLFILLED: 'FULLFILLED',
  REJECTED: 'REJECTED',
};

Quotations.attachSchema(new SimpleSchema({
  userId: { type: String, index: true },
  productId: { type: String, index: true },
  status: { type: String, index: true },
  quotationNumber: String,
  price: Number,
  expires: Date,
  meta: { type: Object, blackbox: true },
  fullfilled: Date,
  currency: String,
  countryCode: String,
  ...timestampFields,
  ...contextFields,
  ...logFields,
}, { requiredByDefault: false }));

export default QuotationStatus;
