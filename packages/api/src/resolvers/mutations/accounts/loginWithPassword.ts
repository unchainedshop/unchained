import { log } from '@unchainedshop/logger';

import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidCredentialsError } from '../../../errors.js';

export default async function loginWithPassword(
  root: Root,
  params: {
    username?: string;
    email?: string;
    password?: string;
  },
  context: Context,
) {
  const { username, email, password } = params;
  log('mutation loginWithPassword', { username, email });

  if (!password) {
    throw new Error('Password is required');
  }

  const user = username
    ? await context.modules.users.findUserByUsername(username)
    : await context.modules.users.findUserByEmail(email);

  const verified =
    user.services?.password &&
    (await context.modules.users.verifyPassword(user.services.password, password));

  if (!verified) throw new InvalidCredentialsError({ username, email });

  if (user.guest) {
    await context.modules.users.updateGuest(user, false);
  }

  await context.modules.users.updateHeartbeat(user._id, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.userAgent,
    locale: context.localeContext.normalized,
    countryCode: context.countryContext,
  });

  if (context.userId) {
    await context.services.users.migrateUserData(context.userId, user._id, context);
  }

  await context.modules.orders.ensureCartForUser(
    {
      user,
      countryCode: context.countryContext,
    },
    context,
  );

  const tokenData = await context.login(user);

  return {
    user,
    ...tokenData,
  };
}
