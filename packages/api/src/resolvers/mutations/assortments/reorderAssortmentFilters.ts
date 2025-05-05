import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function reorderAssortmentFilters(
  root: never,
  params: { sortKeys: { assortmentFilterId: string; sortKey: number }[] },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentFilters', { userId });

  return modules.assortments.filters.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
