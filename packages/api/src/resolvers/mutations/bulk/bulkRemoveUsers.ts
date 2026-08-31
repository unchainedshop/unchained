import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkRemoveUsers(
  root: never,
  { userIds }: { userIds: string[] },
  { services, userId }: Context,
) {
  log(`mutation bulkRemoveUsers for ${userIds.length} users`, { userId });

  const result = await services.users.bulkDeleteUsers({ userIds: normalizeBulkIds(userIds) });
  return createBulkOperationResult(result);
}
