import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { TwoFactorAlreadySetError, TwoFactorCodeDidNotMatchError } from '../../../errors';

export default async function enableTOTP(
  root: Root,
  params: { code: string; secretBase32: string },
  { modules, userId }: Context,
) {
  log(`mutation enableTOTP ${params.code}`, {
    userId,
  });
  try {
    await modules.accounts.enableTOTP(userId, params.secretBase32, params.code);
  } catch (e) {
    if (e?.message?.includes("2FA code didn't match"))
      throw new TwoFactorCodeDidNotMatchError({ submittedCode: params.code, userId });
    else if (e?.message?.includes('2FA already set')) throw new TwoFactorAlreadySetError({ userId });
    else throw e;
  }

  return modules.users.findUserById(userId);
}
