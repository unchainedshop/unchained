import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { QuotationNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { quotationId }, { userId }) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new InvalidIdError({ quotationId });
  const selector = { _id: quotationId };
  const quotation = Quotations.findOne(selector);

  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  return quotationId;
}
