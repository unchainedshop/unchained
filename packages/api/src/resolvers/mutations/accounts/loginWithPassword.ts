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

  const hashInDb = user.services?.password?.bcrypt;
  const verified = hashInDb && (await context.modules.users.verifyPassword(hashInDb, password));
  if (verified) {
    const tokenData = await context.login(user);
    // eslint-disable-next-line
    (user as any)._inLoginMethodResponse = true;
    return {
      id: user._id,
      ...tokenData,
    };
  }

  throw new InvalidCredentialsError({ username, email });
}
