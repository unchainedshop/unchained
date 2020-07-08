import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { QuotationNotFoundError } from '../../errors';

export default function (root, { quotationId }, { userId }) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new Error('Invalid quotation ID provided');

  const selector = { _id: quotationId };
  const quotation = Quotations.findOne(selector);

  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  return quotationId;
}
