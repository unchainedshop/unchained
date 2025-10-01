import { QuotationStatus } from '@unchainedshop/core-quotations';
import { Context } from '../../../../context.js';
import { QuotationNotFoundError, QuotationWrongStatusError } from '../../../../errors.js';
import { Params } from '../schemas.js';
import { getNormalizedQuotationDetails } from '../../../utils/getNormalizedQuotationDetails.js';

export default async function rejectQuotation(context: Context, params: Params<'REJECT'>) {
  const { modules, services } = context;
  const { quotationId, quotationContext } = params;

  const quotation = await modules.quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  if (quotation.status === QuotationStatus.FULLFILLED) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }

  const rejectedQuotation = await services.quotations.rejectQuotation(quotation, quotationContext || {});

  return getNormalizedQuotationDetails(rejectedQuotation._id, context);
}
