import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function reorderAssortmentProducts(
  root: Root,
  params: { sortKeys: Array<{ assortmentProductId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentProducts', { modules, userId });
  return modules.assortments.products.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
