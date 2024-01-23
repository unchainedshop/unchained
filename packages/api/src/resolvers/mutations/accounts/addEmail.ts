import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { EmailAlreadyExistsError, UserNotFoundError } from '../../../errors.js';

export default async function addEmail(
  root: Root,
  params: { email: string; userId?: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation addEmail ${params.email} ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  try {
    await modules.users.addEmail(normalizedUserId, params.email);
  } catch (e) {
    if (e.cause === 'EMAIL_INVALID') throw new EmailAlreadyExistsError({ email: params?.email });
    else throw e;
  }

  return modules.users.findUserById(normalizedUserId);
}
