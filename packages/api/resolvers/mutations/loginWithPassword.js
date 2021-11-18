import { log } from 'unchained-logger';
import { Users } from 'meteor/unchained:core-users';
import hashPassword from '../../hashPassword';

export default async function loginWithPassword(
  root,
  { username, email, password: hashedPassword, plainPassword, totpCode },
  context
) {
  log('mutation loginWithPassword', { username, email });
  if (!hashedPassword && !plainPassword) {
    throw new Error('Password is required');
  }

  const password = hashedPassword || hashPassword(plainPassword);
  const userQuery = email ? { email } : { username };

  return Users.loginWithService(
    'password',
    {
      user: userQuery,
      password,
      code: totpCode,
    },
    context
  );
}
