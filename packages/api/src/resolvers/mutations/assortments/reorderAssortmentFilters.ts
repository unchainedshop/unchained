import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

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
