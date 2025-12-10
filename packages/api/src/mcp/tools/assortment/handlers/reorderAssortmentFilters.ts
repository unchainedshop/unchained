import type { Context } from '../../../../context.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';

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
