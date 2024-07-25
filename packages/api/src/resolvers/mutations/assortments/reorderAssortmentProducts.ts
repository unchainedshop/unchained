import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function reorderAssortmentProducts(
  root: never,
  params: { sortKeys: Array<{ assortmentProductId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentProducts', { userId });
  return modules.assortments.products.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
