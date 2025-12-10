import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function reorderAssortmentProducts(
  root: never,
  params: { sortKeys: { assortmentProductId: string; sortKey: number }[] },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentProducts', { userId });
  return modules.assortments.products.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
