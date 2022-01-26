import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, UserNotFoundError } from '../../../errors';

export default async function updateUserProfile(
  root: Root,
  params: { roles: Array<string>; userId: string },
  { modules, userId }: Context
) {
  const foreignUserId = params.userId;

  log(`mutation setRoles ${foreignUserId}`, { userId });

  if (!foreignUserId) throw new InvalidIdError({ foreignUserId });
  if (!(await modules.users.userExists({ userId: foreignUserId })))
    throw new UserNotFoundError({ userId: foreignUserId });

  return modules.users.updateRoles(foreignUserId, params.roles, userId);
}
