import { Context } from '../../../../context.js';
import { FilterNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function removeFilter(context: Context, params: Params<'REMOVE'>) {
  const { modules } = context;
  const { filterId } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  const assortmentFilters = await modules.assortments.filters.findFilters({ filterId } as any);
  await Promise.all(
    assortmentFilters.map(async (assortmentFilter) => {
      await modules.assortments.filters.delete(assortmentFilter._id);
    }),
  );

  await modules.filters.delete(filterId);
  return { success: true };
}
