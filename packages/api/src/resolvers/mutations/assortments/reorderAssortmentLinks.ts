import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function reorderAssortmentLinks(
  root: Root,
  params: { sortKeys: Array<{ assortmentLinkId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentLinks', { userId });
  return modules.assortments.links.updateManualOrder(
    {
      sortKeys: params.sortKeys,
    },
    { skipInvalidation: false },
  );
}
