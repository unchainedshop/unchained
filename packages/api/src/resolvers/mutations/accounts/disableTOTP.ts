import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { TwoFactorCodeDidNotMatchError, TwoFactorNotSetError, UserNotFoundError } from '../../../errors';

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
  try {
    await modules.accounts.disableTOTP(normalizedUserId, params.code);
  } catch (e) {
    if (e?.message?.includes("2FA code didn't match"))
      throw new TwoFactorCodeDidNotMatchError({
        submittedCode: params.code,
        userId: params?.userId || userId,
      });
    else if (e?.message?.includes('2FA not set'))
      throw new TwoFactorNotSetError({ userId: params?.userId || userId });
    else throw e;
  }

  return user;
}
