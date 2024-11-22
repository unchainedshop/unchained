import { log } from '@unchainedshop/logger';
import { UserNotFoundError, InvalidIdError, UsernameAlreadyExistsError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function setUsername(
  root: never,
  params: { username: string; userId: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation setUsername ${normalizedUserId}`, { userId });

  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  try {
    await modules.users.setUsername(normalizedUserId, params.username);
  } catch (e) {
    if (e.cause === 'USERNAME_INVALID')
      throw new UsernameAlreadyExistsError({ userId: normalizedUserId });
    else throw e;
  }

  return modules.users.findUserById(normalizedUserId);
}
