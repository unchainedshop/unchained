import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function reorderAssortmentProducts(
  root: Root,
  params: { sortKeys: Array<{ assortmentProductId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentProducts', { userId });
  return modules.assortments.products.updateManualOrder(
    {
      sortKeys: params.sortKeys,
    },
    { skipInvalidation: false },
    userId,
  );
}
