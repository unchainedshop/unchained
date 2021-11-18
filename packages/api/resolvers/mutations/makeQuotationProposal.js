import { log } from 'unchained-logger';
import { Quotations, QuotationStatus } from 'meteor/unchained:core-quotations';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function makeQuotationProposal(
  root,
  { quotationId, ...transactionContext },
  { userId }
) {
  log('mutation makeQuotationProposal', { quotationId, userId });
  if (!quotationId) throw new InvalidIdError({ quotationId });
  const quotation = Quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });
  if (quotation.status !== QuotationStatus.PROCESSING) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }
  return quotation.propose(transactionContext);
}
