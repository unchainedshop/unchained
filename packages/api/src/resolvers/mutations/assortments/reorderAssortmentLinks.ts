import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function reorderAssortmentLinks(
  root: never,
  params: { sortKeys: { assortmentLinkId: string; sortKey: number }[] },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentLinks', { userId });
  return modules.assortments.links.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
