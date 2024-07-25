import { log } from '@unchainedshop/logger';
import { InvalidResetTokenError, PasswordInvalidError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function resetPassword(
  root: never,
  params: { newPassword?: string; token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log('mutation resetPassword', { userId });

  if (!params.newPassword) {
    throw new Error('Password is required');
  }
  let user = await modules.users.findUserByResetToken(params.token);

  if (!user) throw new InvalidResetTokenError({});

  try {
    await modules.users.setPassword(user._id, params.newPassword);

    // TODO: Verify E-Mail after reset!
    // if (resetTicket.address) {
    //   // Try verifying the E-Mail along the way
    //   try {
    //     const updatedUser = await modules.users.updateUser(
    //       {
    //         _id: userWithNewPassword.id,
    //         emails: {
    //           $elemMatch: {
    //             address: emailRegexOperator(resetTicket.address),
    //             verified: false,
    //           },
    //         },
    //       },
    //       {
    //         $set: {
    //           'emails.$[email].verified': true,
    //         },
    //       },
    //       {
    //         arrayFilters: [{ 'email.address': resetTicket.address }],
    //       },
    //     );
    //     if (updatedUser) {
    //       await modules.accounts.emit('VerifyEmailSuccess', updatedUser);
    //     }
    //   } catch (e) {
    //     /* */
    //   }
    // }
  } catch (e) {
    if (e.cause === 'PASSWORD_INVALID') throw new PasswordInvalidError({ userId: user._id });
    else throw e;
  }

  user = await context.modules.users.updateHeartbeat(user._id, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.userAgent,
    locale: context.localeContext.normalized,
    countryCode: context.countryContext,
  });

  return context.login(user);
}
