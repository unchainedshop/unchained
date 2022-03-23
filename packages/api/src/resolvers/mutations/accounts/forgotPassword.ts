import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function forgotPassword(
  root: Root,
  { email }: { email: string },
  { modules, userId }: Context,
) {
  log('mutation forgotPassword', { email, userId });

  const success = await modules.accounts.sendResetPasswordEmail(email);

  return { success };
}
