import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function removeUser(
  root: Root,
  params: { userId: string },
  { modules, userId }: Context,
) {
  const { userId: paramUserId } = params;
  const normalizedUserId = paramUserId || userId;

  log(`mutation removeUser ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw UserNotFoundError({ id: normalizedUserId });

  return modules.users.delete(normalizedUserId);
}
