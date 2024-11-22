import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { UserNotFoundError } from '../../../errors.js';

export default async function removeUser(
  root: never,
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
