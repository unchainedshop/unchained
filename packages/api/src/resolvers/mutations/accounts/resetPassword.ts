import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function resetPassword(
  root: Root,
  params: { newPlainPassword?: string; token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log('mutation resetPassword', { userId });

  if (!params.newPlainPassword) {
    throw new Error('Password is required');
  }

  const userWithNewPassword = await modules.accounts.resetPassword(params, context);

  return modules.accounts.createLoginToken(userWithNewPassword.id, context);
}
