import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { QuotationNotFoundError, InvalidIdError } from '../../errors';

export default function quotation(root, { quotationId }, { userId }) {
  log(`query quotation ${quotationId}`, { userId, quotationId });
  if (!quotationId) throw new InvalidIdError({ quotationId });
  const foundQuotation = Quotations.findQuotation({ quotationId });
  if (!foundQuotation) throw new QuotationNotFoundError({ quotationId });
  return foundQuotation;
}
