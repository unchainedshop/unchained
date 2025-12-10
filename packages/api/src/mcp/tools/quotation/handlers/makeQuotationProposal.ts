import { QuotationStatus } from '@unchainedshop/core-quotations';
import type { Context } from '../../../../context.ts';
import { QuotationNotFoundError, QuotationWrongStatusError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedQuotationDetails } from '../../../utils/getNormalizedQuotationDetails.ts';

export default async function makeQuotationProposal(context: Context, params: Params<'MAKE_PROPOSAL'>) {
  const { modules, services } = context;
  const { quotationId, quotationContext } = params;
  const quotation = await modules.quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  if (quotation.status !== QuotationStatus.PROCESSING) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }

  const proposedQuotation = await services.quotations.proposeQuotation(
    quotation,
    quotationContext || {},
  );

  return getNormalizedQuotationDetails(proposedQuotation._id, context);
}
