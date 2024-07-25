import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function reorderAssortmentFilters(
  root: never,
  params: { sortKeys: Array<{ assortmentFilterId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentFilters', { userId });

  return modules.assortments.filters.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
