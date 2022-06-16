import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';

export default async function sendVerificationEmail(
  root: Root,
  { email }: { email: string },
  { modules, userId }: Context,
) {
  log('mutation sendVerificationEmail', { email, userId });

  await modules.accounts.sendVerificationEmail(email);

  return {
    success: true,
  };
}
