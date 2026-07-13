import type { Modules } from '../modules.ts';
import { deleteUserService } from './deleteUser.ts';
import { executeBulkOperation } from './executeBulkOperation.ts';

export async function bulkDeleteUsersService(
  this: Modules,
  { userIds }: { userIds: string[] },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  return executeBulkOperation(userIds, async (userId) => {
    const result = await deleteUserService.call(this, { userId });
    if (!result) throw new Error('delete-failed');
  });
}
