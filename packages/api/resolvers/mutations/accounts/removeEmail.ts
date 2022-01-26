import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function removeEmail(
  root: Root,
  params: { email: string; userId?: string },
  { modules, userId }: Context
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation removeEmail ${params.email} ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  await modules.accounts.removeEmail(normalizedUserId, params.email);

  return modules.users.findUser({ userId: normalizedUserId });
}
