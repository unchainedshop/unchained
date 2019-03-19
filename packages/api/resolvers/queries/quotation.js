import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';

export default function(root, { quotationId }, { userId }) {
  log(`query quotation ${quotationId}`, { userId, quotationId });
  const selector = { _id: quotationId };
  return Quotations.findOne(selector);
}
