import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function removeAssortmentFilter(context: Context, params: Params<'REMOVE_FILTER'>) {
  const { modules } = context;
  const { assortmentFilterId } = params;

  const deletedAssortmentFilter = await modules.assortments.filters.delete(assortmentFilterId);
  return { success: Boolean(deletedAssortmentFilter) };
}
