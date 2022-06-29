import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function disableTOTP(
  root: Root,
  params: { code: string; userId: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation disableTOTP ${params.code} ${normalizedUserId}`, {
    userId,
  });

  const user = await modules.users.findUserById(normalizedUserId);
  if (!user) throw new UserNotFoundError({ userId: normalizedUserId });

  await modules.accounts.disableTOTP(normalizedUserId, params.code);

  return user;
}
