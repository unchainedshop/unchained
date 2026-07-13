import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkRemoveUsers(
  root: never,
  { userIds }: { userIds: string[] },
  { services, userId }: Context,
) {
  log(`mutation bulkRemoveUsers for ${userIds.length} users`, { userId });

  const { successIds, failedIds } = await services.users.bulkDeleteUsers({ userIds });

  return { successCount: successIds.length, failedCount: failedIds.length, failedIds };
}
