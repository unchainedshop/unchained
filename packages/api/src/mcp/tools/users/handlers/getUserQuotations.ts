import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

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

  return { quotations }
}
