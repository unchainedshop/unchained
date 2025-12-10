import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function reorderAssortmentMedia(
  root: never,
  params: { sortKeys: { assortmentMediaId: string; sortKey: number }[] },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentMedia', { userId });
  return modules.assortments.media.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
