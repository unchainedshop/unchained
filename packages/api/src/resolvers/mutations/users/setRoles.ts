import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, UserNotFoundError } from '../../../errors.js';

export default async function setRoles(
  root: never,
  params: { roles: Array<string>; userId: string },
  { modules, userId }: Context,
) {
  const foreignUserId = params.userId;

  log(`mutation setRoles ${foreignUserId}`, { userId });

  if (!foreignUserId) throw new InvalidIdError({ foreignUserId });
  if (!(await modules.users.userExists({ userId: foreignUserId })))
    throw new UserNotFoundError({ userId: foreignUserId });

  return modules.users.updateRoles(foreignUserId, params.roles);
}
