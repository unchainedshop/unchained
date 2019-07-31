import { log } from 'meteor/unchained:core-logger';
import { Quotations, QuotationStatus } from 'meteor/unchained:core-quotations';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError
} from '../../errors';

export default async function(
  root,
  { quotationId, ...transactionContext },
  { userId }
) {
  log('mutation verifyQuotation', { quotationId, userId });
  const quotation = Quotations.findOne({ _id: quotationId });
  if (!quotation) throw new QuotationNotFoundError({ data: { quotationId } });
  if (quotation.status !== QuotationStatus.REQUESTED) {
    throw new QuotationWrongStatusError({ data: { status: quotation.status } });
  }
  return quotation.verify(transactionContext);
}
