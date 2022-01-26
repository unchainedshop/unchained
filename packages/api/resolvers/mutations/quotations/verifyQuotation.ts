import { log } from 'meteor/unchained:logger';
import { QuotationStatus } from 'meteor/unchained:core-quotations';
import { Context, Root } from '@unchainedshop/types/api';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError,
  InvalidIdError,
} from '../../../errors';

export default async function verifyQuotation(
  root: Root,
  params: { quotationId: string; quotationContext?: any },
  context: Context
) {
  const { modules, userId } = context;
  const { quotationId, ...transactionContext } = params;

  log('mutation verifyQuotation', { quotationId, userId });

  if (!quotationId) throw new InvalidIdError({ quotationId });

  const quotation = await modules.quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  if (quotation.status !== QuotationStatus.REQUESTED) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }

  return modules.quotations.verifyQuotation(
    quotation,
    transactionContext,
    context
  );
}
