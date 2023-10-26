import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import moniker from 'moniker';
import { randomValueHex } from '@unchainedshop/utils';

export default async function loginAsGuest(root: Root, _: any, context: Context) {
  log('mutation loginAsGuest');

  const guestname = `${moniker.choose()}-${randomValueHex(5)}`;
  const guestUserId = await context.modules.users.createUser(
    {
      email: `${guestname}@unchained.local`,
      guest: true,
      password: null,
      initialPassword: true,
    },
    { skipMessaging: true },
  );
  const user = await context.modules.users.findUserById(guestUserId);
  const tokenData = await context.login(user);
  return {
    user,
    ...tokenData,
  };
}
