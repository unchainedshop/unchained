import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserNotFoundError } from '../../../errors.js';

export default async function removeEmail(
  root: Root,
  params: { email: string; userId?: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation removeEmail ${params.email} ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  await modules.users.removeEmail(normalizedUserId, params.email);

  return modules.users.findUserById(normalizedUserId);
}
