import type { Modules } from '../modules.ts';
import { executeBulkOperation } from '@unchainedshop/utils';
import { deleteUserService } from './deleteUser.ts';

export async function bulkDeleteUsersService(
  this: Modules,
  { userIds }: { userIds: string[] },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  return executeBulkOperation(userIds, async (userId) => {
    if (!(await this.users.userExists({ userId }))) throw new Error('not-found');
    const result = await deleteUserService.call(this, { userId });
    if (!result) throw new Error('delete-failed');
  });
}
