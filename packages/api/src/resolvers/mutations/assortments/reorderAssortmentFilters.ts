import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function reorderAssortmentFilters(
  root: Root,
  params: { sortKeys: Array<{ assortmentFilterId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentFilters', { userId });

  return modules.assortments.filters.updateManualOrder(
    {
      sortKeys: params.sortKeys,
    },
    userId,
  );
}
