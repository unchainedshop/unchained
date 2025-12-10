import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedQuotationDetails } from '../../../utils/getNormalizedQuotationDetails.ts';

export default async function listQuotations(context: Context, params: Params<'LIST'>) {
  const { modules } = context;
  const quotations = await modules.quotations.findQuotations(params as any);

  return {
    quotations: await Promise.all(
      quotations.map((quotation) => getNormalizedQuotationDetails(quotation._id, context)),
    ),
  };
}
