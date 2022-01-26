import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function reorderAssortmentLinks(
  root: Root,
  params: { sortKeys: Array<{ assortmentLinkId: string; sortKey: number }> },
  { modules, userId }: Context
) {
  log('mutation reorderAssortmentLinks', { modules, userId });
  return modules.assortments.links.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
