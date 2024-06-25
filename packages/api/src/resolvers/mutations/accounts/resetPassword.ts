import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { emailRegexOperator } from '@unchainedshop/mongodb';
import {
  AuthOperationFailedError,
  InvalidResetTokenError,
  NoEmailSetError,
  ResetPasswordLinkExpiredError,
  ResetPasswordLinkUnknownAddressError,
} from '../../../errors.js';

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

    const resetTicket = userWithNewPassword?.services?.password?.reset?.find(
      (t) => t.token === params.token,
    );
    if (resetTicket.address) {
      // Try verifying the E-Mail along the way
      try {
        const updatedUser = await modules.users.updateUser(
          {
            _id: userWithNewPassword.id,
            emails: {
              $elemMatch: {
                address: emailRegexOperator(resetTicket.address),
                verified: false,
              },
            },
          },
          {
            $set: {
              'emails.$[email].verified': true,
            },
          },
          {
            arrayFilters: [{ 'email.address': resetTicket.address }],
          },
        );
        if (updatedUser) {
          await modules.accounts.emit('VerifyEmailSuccess', updatedUser);
        }
      } catch (e) {
        /* */
      }
    }

    const result = await modules.accounts.createLoginToken(userWithNewPassword.id, context);
    return result;
  } catch (e) {
    log(e);
    if (e.code === 'InvalidToken') throw new InvalidResetTokenError({});
    if (e.code === 'ResetPasswordLinkExpired') throw new ResetPasswordLinkExpiredError({});
    if (e.code === 'ResetPasswordLinkUnknownAddress​')
      throw new ResetPasswordLinkUnknownAddressError({});
    if (e.code === 'NoEmailSet') throw new NoEmailSetError({});
    throw new AuthOperationFailedError({});
  }
}
