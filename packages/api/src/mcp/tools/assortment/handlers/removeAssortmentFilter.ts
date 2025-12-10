import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function removeAssortmentFilter(context: Context, params: Params<'REMOVE_FILTER'>) {
  const { modules } = context;
  const { assortmentFilterId } = params;

  const deletedAssortmentFilter = await modules.assortments.filters.delete(assortmentFilterId);
  return { success: Boolean(deletedAssortmentFilter) };
}
