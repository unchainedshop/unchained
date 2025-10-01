import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';
import { getNormalizedQuotationDetails } from '../../../utils/getNormalizedQuotationDetails.js';

export default async function listQuotations(context: Context, params: Params<'LIST'>) {
  const { modules } = context;
  const quotations = await modules.quotations.findQuotations(params as any);

  return {
    quotations: await Promise.all(
      quotations.map((quotation) => getNormalizedQuotationDetails(quotation._id, context)),
    ),
  };
}
