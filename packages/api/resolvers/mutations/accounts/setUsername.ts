import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError, InvalidIdError } from '../../../errors';

export default async function setUsername(
  root: Root,
  params: { username: string; userId: string },
  { modules, userId }: Context
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation setUsername ${normalizedUserId}`, { userId });

  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  await modules.accounts.setUsername(normalizedUserId, params.username);

  return modules.users.findUser({ userId: normalizedUserId });
}
