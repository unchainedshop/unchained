import { log } from 'unchained-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function enableTOTP(
  root,
  { code, secretBase32 },
  { userId }
) {
  log('mutation enableTOTP', { userId, code });

  await Users.enableTOTP(userId, secretBase32, code);
  return Users.findUser({ userId });
}
