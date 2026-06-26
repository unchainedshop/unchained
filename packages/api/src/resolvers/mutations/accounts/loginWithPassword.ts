import { log } from '@unchainedshop/logger';
import { emit } from '@unchainedshop/events';
import { InvalidCredentialsError, UsernameOrEmailRequiredError } from '../../../errors.ts';
import { API_EVENTS } from '../../../events.ts';
import type { Context } from '../../../context.ts';
import type { User } from '@unchainedshop/core-users';

export default async function loginWithPassword(
  root: never,
  params: {
    username?: string;
    email?: string;
    password: string;
  },
  context: Context,
) {
  const { username, email, password } = params;
  log('mutation loginWithPassword', { username, email });

  if (!username && !email) throw new UsernameOrEmailRequiredError({});

  let user = username
    ? await context.modules.users.findUserByUsername(username)
    : await context.modules.users.findUserByEmail(email!);

  if (!user) {
    await emit(API_EVENTS.API_LOGIN_FAILED, {
      username,
      email,
      remoteAddress: context.remoteAddress,
    });
    throw new InvalidCredentialsError({ username, email });
  }

  const verified =
    user.services?.password &&
    (await context.modules.users.verifyPassword(user.services.password, password));

  if (!verified) {
    await emit(API_EVENTS.API_LOGIN_FAILED, {
      userId: user._id,
      username: user.username,
      remoteAddress: context.remoteAddress,
    });
    throw new InvalidCredentialsError({ username, email });
  }

  if (user.guest) {
    await context.modules.users.updateGuest(user, false);
  }

  user = (await context.modules.users.updateHeartbeat(user._id, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.getHeader('user-agent'),
    locale: context.locale?.baseName,
    countryCode: context.countryCode,
  })) as User;

  if (context.userId) {
    await context.services.users.migrateUserData(context.userId, user._id);
  }

  await context.services.orders.nextUserCart({ user, countryCode: context.countryCode });

  return context.login(user);
}
