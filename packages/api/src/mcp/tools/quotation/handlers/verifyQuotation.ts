import { QuotationStatus } from '@unchainedshop/core-quotations';
import type { Context } from '../../../../context.ts';
import { QuotationNotFoundError, QuotationWrongStatusError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedQuotationDetails } from '../../../utils/getNormalizedQuotationDetails.ts';

export default async function verifyQuotation(context: Context, params: Params<'VERIFY'>) {
  const { modules, services } = context;
  const { quotationId, quotationContext } = params;

  const quotation = await modules.quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  if (quotation.status !== QuotationStatus.REQUESTED) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }

  const verifiedQuotation = await services.quotations.verifyQuotation(quotation, quotationContext || {});

  return getNormalizedQuotationDetails(verifiedQuotation._id, context);
}
