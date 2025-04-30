import { log } from '@unchainedshop/logger';
import { InvalidResetTokenError, PasswordInvalidError } from '../../../errors.js';
import { Context } from '../../../context.js';

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

  try {
    let user = await modules.users.resetPassword(params.token, params.newPassword);
    if (!user) throw new InvalidResetTokenError({});

    user = await context.modules.users.updateHeartbeat(user._id, {
      remoteAddress: context.remoteAddress,
      remotePort: context.remotePort,
      userAgent: context.getHeader('user-agent'),
      locale: context.locale.baseName,
      countryCode: context.countryCode,
    });

    if (context.userId) {
      await context.services.users.migrateUserData(context.userId, user._id);
    }

    await context.services.orders.nextUserCart({ user, countryCode: context.countryCode });

    return context.login(user);
  } catch (e) {
    if (e.cause === 'PASSWORD_INVALID') throw new PasswordInvalidError({});
    else throw e;
  }
}
