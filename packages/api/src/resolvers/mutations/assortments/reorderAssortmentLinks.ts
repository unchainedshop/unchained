import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function reorderAssortmentLinks(
  root: never,
  params: { sortKeys: Array<{ assortmentLinkId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentLinks', { userId });
  return modules.assortments.links.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
