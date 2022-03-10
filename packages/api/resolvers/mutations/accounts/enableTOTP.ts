import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function enableTOTP(
  root: Root,
  params: { code: string; secretBase32: string },
  { modules, userId }: Context,
) {
  log(`mutation disableTOTP ${params.code}`, {
    userId,
  });

  await modules.accounts.enableTOTP(userId, params.secretBase32, params.code);

  return modules.users.findUserById(userId);
}
