import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { Roles } from '@unchainedshop/roles';
import { InvalidIdError, UserNotFoundError } from '../../../errors.ts';

// Note: This resolver is protected by the 'manageUsers' ACL action (see mutations/index.ts)
// Only users with the 'admin' role have the 'manageUsers' permission by default
export default async function setRoles(
  root: never,
  params: { roles: string[]; userId: string },
  { modules, userId }: Context,
) {
  const foreignUserId = params.userId;

  log(`mutation setRoles ${foreignUserId}`, { userId });

  if (!foreignUserId) throw new InvalidIdError({ foreignUserId });
  if (!(await modules.users.userExists({ userId: foreignUserId })))
    throw new UserNotFoundError({ userId: foreignUserId });

  const invalidRoles = params.roles.filter((role) => !Roles.roles[role]);
  if (invalidRoles.length > 0) {
    throw new Error(`Invalid role names: ${invalidRoles.join(', ')}`);
  }

  return modules.users.updateRoles(foreignUserId, params.roles);
}
