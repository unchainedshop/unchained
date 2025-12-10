import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getAssortmentFilters(context: Context, params: Params<'GET_FILTERS'>) {
  const { modules } = context;
  const { assortmentId } = params;

  const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const filters = await modules.assortments.filters.findFilters(
    { assortmentId },
    { sort: { sortKey: 1 } },
  );
  const filters_normalized = await Promise.all(
    filters?.map(async ({ filterId, ...rest }) => ({
      ...(await getNormalizedFilterDetails(filterId, context)),
      ...rest,
    })) || [],
  );
  return { assortment, filters: filters_normalized };
}
