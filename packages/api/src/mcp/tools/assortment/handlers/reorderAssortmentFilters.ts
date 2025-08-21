import { Context } from '../../../../context.js';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.js';
import { Params } from '../schemas.js';

export default async function reorderAssortmentFilters(
  context: Context,
  params: Params<'REORDER_FILTERS'>,
) {
  const { modules } = context;
  const { sortKeys } = params;

  const reorderedFilters = await modules.assortments.filters.updateManualOrder({
    sortKeys: sortKeys as any,
  });
  const filters = await Promise.all(
    reorderedFilters?.map(async ({ filterId, ...rest }) => ({
      ...(await getNormalizedFilterDetails(filterId, context)),
      ...rest,
    })) || [],
  );
  return { filters };
}
