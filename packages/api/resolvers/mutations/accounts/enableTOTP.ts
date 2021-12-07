import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function enableTOTP(
  root: Root,
  params: { code: string; secretBase32: string },
  { modules, userId }: Context
) {
  log(`mutation disableTOTP ${params.code}`, {
    userId,
  });

  const user = await modules.users.findUser({ userId });
  if (!user) throw new UserNotFoundError({ userId });

  await modules.accounts.enableTOTP(userId, params.secretBase32, params.code);

  return user;
}
