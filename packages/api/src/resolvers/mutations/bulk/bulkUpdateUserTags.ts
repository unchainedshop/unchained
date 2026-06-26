import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkUpdateUserTags(
  root: never,
  { userIds, add, remove }: { userIds: string[]; add?: string[]; remove?: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkUpdateUserTags for ${userIds.length} users`, { userId });

  if (remove?.length) {
    await modules.users.bulkRemoveTags(userIds, remove);
  }
  if (add?.length) {
    await modules.users.bulkAddTags(userIds, add);
  }

  return { successCount: userIds.length, failedCount: 0, failedIds: [] };
}
