import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';
import { getNormalizedQuotationDetails } from '../../../utils/getNormalizedQuotationDetails.js';

export default async function getQuotation(context: Context, params: Params<'GET'>) {
  const { quotationId } = params;
  return getNormalizedQuotationDetails(quotationId, context);
}
