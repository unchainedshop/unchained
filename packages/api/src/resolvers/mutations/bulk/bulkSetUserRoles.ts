import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { getPublicRoles } from '../../../roles/index.ts';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkSetUserRoles(
  root: never,
  { userIds, roles }: { userIds: string[]; roles: string[] },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation bulkSetUserRoles for ${userIds.length} users`, { userId });

  const publicRoles = getPublicRoles(context.roles!);
  const invalidRoles = roles.filter((r) => !publicRoles.includes(r));
  if (invalidRoles.length) {
    throw new Error(`Invalid role names: ${invalidRoles.join(', ')}`);
  }

  const result = await modules.users.bulkUpdateRoles(normalizeBulkIds(userIds), roles);
  return createBulkOperationResult(result);
}
