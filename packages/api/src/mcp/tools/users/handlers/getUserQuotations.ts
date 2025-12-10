import type { Context } from '../../../../context.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getUserQuotations(context: Context, params: Params<'GET_QUOTATIONS'>) {
  const { modules } = context;
  const { userId, sort, queryString, limit = 10, offset = 0 } = params;

  const quotations = await modules.quotations.findQuotations(
    {
      userId,
      queryString,
    },
    {
      skip: offset,
      limit,
      sort: sort?.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as any),
    },
  );

  const normalizedQuotations = await Promise.all(
    quotations.map(async ({ productId, ...quotation }) => ({
      ...(await getNormalizedProductDetails(productId, context)),
      ...quotation,
    })),
  );

  return { quotations: normalizedQuotations };
}
