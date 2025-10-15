import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function setPassword(
  root: Root,
  params: { newPlainPassword: string; userId: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation setPassword ${normalizedUserId}`, { userId });

  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  if (!params.newPlainPassword) {
    throw new Error('Password is required');
  }
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  await modules.accounts.setPassword(normalizedUserId, params);

  // Verify!
  await modules.users.updateUser({ _id: normalizedUserId }, {
    
  });

  return modules.users.findUserById(normalizedUserId);
}
