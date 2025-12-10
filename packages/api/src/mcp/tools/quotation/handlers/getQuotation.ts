import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedQuotationDetails } from '../../../utils/getNormalizedQuotationDetails.ts';

export default async function getQuotation(context: Context, params: Params<'GET'>) {
  const { quotationId } = params;
  return getNormalizedQuotationDetails(quotationId, context);
}
