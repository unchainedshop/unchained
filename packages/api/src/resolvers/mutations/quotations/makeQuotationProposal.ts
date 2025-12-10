import { log } from '@unchainedshop/logger';
import { QuotationStatus } from '@unchainedshop/core-quotations';
import type { Context } from '../../../context.ts';
import { QuotationNotFoundError, QuotationWrongStatusError, InvalidIdError } from '../../../errors.ts';

export default async function makeQuotationProposal(
  root: never,
  params: { quotationId: string; quotationContext?: any },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { quotationId, ...transactionContext } = params;

  log('mutation makeQuotationProposal', { quotationId, userId });

  if (!quotationId) throw new InvalidIdError({ quotationId });

  const quotation = await modules.quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  if (quotation.status !== QuotationStatus.PROCESSING) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }

  return services.quotations.proposeQuotation(quotation, transactionContext);
}
