import { log } from '@unchainedshop/logger';
import { QuotationStatus } from '@unchainedshop/core-quotations';
import { Context } from '../../../context.js';
import { QuotationNotFoundError, QuotationWrongStatusError, InvalidIdError } from '../../../errors.js';

export default async function makeQuotationProposal(
  root: never,
  params: { quotationId: string; quotationContext?: any },
  context: Context,
) {
  const { modules, userId } = context;
  const { quotationId, ...transactionContext } = params;

  log('mutation makeQuotationProposal', { quotationId, userId });

  if (!quotationId) throw new InvalidIdError({ quotationId });

  const quotation = await modules.quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  if (quotation.status !== QuotationStatus.PROCESSING) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }

  return modules.quotations.proposeQuotation(quotation, transactionContext, context);
}
