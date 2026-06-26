import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkRemoveAssortments(
  root: never,
  { assortmentIds }: { assortmentIds: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkRemoveAssortments for ${assortmentIds.length} assortments`, { userId });

  const { successIds, failedIds } = await modules.assortments.bulkDelete(assortmentIds);

  return { successCount: successIds.length, failedCount: failedIds.length, failedIds };
}
