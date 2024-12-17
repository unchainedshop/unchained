import { log } from '@unchainedshop/logger';
import { InvalidCredentialsError, UsernameOrEmailRequiredError } from '../../../errors.js';
import { Context } from '../../../context.js';

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
    : await context.modules.users.findUserByEmail(email);

  if (!user) throw new InvalidCredentialsError({ username, email });

  const verified =
    user.services?.password &&
    (await context.modules.users.verifyPassword(user.services.password, password));

  if (!verified) throw new InvalidCredentialsError({ username, email });

  if (user.guest) {
    await context.modules.users.updateGuest(user, false);
  }

  user = await context.modules.users.updateHeartbeat(user._id, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.userAgent,
    locale: context.localeContext.baseName,
    countryCode: context.countryContext,
  });

  if (context.userId) {
    await context.services.users.migrateUserData(context.userId, user._id);
  }

  await context.services.orders.nextUserCart({ user, countryCode: context.countryContext }, context);

  return context.login(user);
}
