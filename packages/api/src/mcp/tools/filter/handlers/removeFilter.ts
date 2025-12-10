import type { Context } from '../../../../context.ts';
import { FilterNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

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
