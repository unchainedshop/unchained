import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.js';
import { Params } from '../schemas.js';

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
