import { log } from 'meteor/unchained:logger';
import { Quotations, QuotationStatus } from 'meteor/unchained:core-quotations';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError,
  InvalidIdError,
} from '../../../errors';

export default async function verifyQuotation(
  root,
  { quotationId, ...transactionContext },
  { userId }
) {
  log('mutation verifyQuotation', { quotationId, userId });
  if (!quotationId) throw new InvalidIdError({ quotationId });
  const quotation = Quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });
  if (quotation.status !== QuotationStatus.REQUESTED) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }
  return quotation.verify(transactionContext);
}
