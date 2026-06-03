import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkUpdateUserTags(
  root: never,
  { userIds, add, remove }: { userIds: string[]; add?: string[]; remove?: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkUpdateUserTags for ${userIds.length} users`, { userId });

  const failedIds: string[] = [];
  let successCount = 0;

  for (const targetUserId of userIds) {
    try {
      const user = await modules.users.findUserById(targetUserId);
      if (!user) {
        failedIds.push(targetUserId);
        continue;
      }

      let tags = user.tags || [];
      if (remove?.length) {
        tags = tags.filter((t) => !remove.includes(t));
      }
      if (add?.length) {
        tags = [...new Set([...tags, ...add])];
      }

      await modules.users.updateTags(targetUserId, tags);
      successCount += 1;
    } catch {
      failedIds.push(targetUserId);
    }
  }

  return { successCount, failedCount: failedIds.length, failedIds };
}
