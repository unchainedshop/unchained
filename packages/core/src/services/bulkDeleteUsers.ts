import type { Modules } from '../modules.ts';
import { deleteUserService } from './deleteUser.ts';

export async function bulkDeleteUsersService(
  this: Modules,
  { userIds }: { userIds: string[] },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  const successIds: string[] = [];
  const failedIds: string[] = [];

  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      const result = await deleteUserService.call(this, { userId });
      if (!result) throw new Error('delete-failed');
      return userId;
    }),
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successIds.push(result.value);
    } else {
      failedIds.push(userIds[index]);
    }
  });

  return { successIds, failedIds };
}
