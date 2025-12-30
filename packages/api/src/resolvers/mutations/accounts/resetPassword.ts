import { log } from '@unchainedshop/logger';
import { InvalidResetTokenError, PasswordInvalidError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function resetPassword(
  root: never,
  params: { newPassword: string; token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log('mutation resetPassword', { userId });

  try {
    const user = await modules.users.resetPassword(params.token, params.newPassword);
    if (!user) throw new InvalidResetTokenError({});

    const updatedUser = await context.modules.users.updateHeartbeat(user._id, {
      remoteAddress: context.remoteAddress,
      remotePort: context.remotePort,
      userAgent: context.getHeader('user-agent'),
      locale: context.locale?.baseName,
      countryCode: context.countryCode,
    });

    if (context.userId && updatedUser) {
      await context.services.users.migrateUserData(context.userId, updatedUser._id);
    }

    await context.services.orders.nextUserCart({
      user: updatedUser || user,
      countryCode: context.countryCode,
    });

    return context.login(updatedUser || user);
  } catch (e) {
    if (e.cause === 'PASSWORD_INVALID') throw new PasswordInvalidError({});
    else throw e;
  }
}
