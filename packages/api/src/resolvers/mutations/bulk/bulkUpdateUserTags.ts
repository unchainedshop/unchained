import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkUpdateUserTags(
  root: never,
  { userIds, add, remove }: { userIds: string[]; add?: string[]; remove?: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkUpdateUserTags for ${userIds.length} users`, { userId });

  const result = await modules.users.bulkUpdateTags(normalizeBulkIds(userIds), { add, remove });
  return createBulkOperationResult(result);
}
