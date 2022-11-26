import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  InvalidResetTokenError,
  NoEmailSetError,
  ResetPasswordLinkExpiredError,
  ResetPasswordLinkUnknownAddressError,
} from '../../../errors';

export default async function resetPassword(
  root: Root,
  params: { newPlainPassword?: string; token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log('mutation resetPassword', { userId });

  if (!params.newPlainPassword) {
    throw new Error('Password is required');
  }
  try {
    const userWithNewPassword = await modules.accounts.resetPassword(params, context);

    const result = await modules.accounts.createLoginToken(userWithNewPassword.id, context);
    return result;
  } catch (e) {
    if (e.code === 'InvalidToken') throw new InvalidResetTokenError({});
    if (e.code === 'ResetPasswordLinkExpired') throw new ResetPasswordLinkExpiredError({});
    if (e.code === 'ResetPasswordLinkUnknownAddress​')
      throw new ResetPasswordLinkUnknownAddressError({});
    if (e.code === 'NoEmailSet') throw new NoEmailSetError({});
    throw e;
  }
}
