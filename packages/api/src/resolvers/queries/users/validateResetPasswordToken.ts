import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function validateResetPasswordToken(
  root: Root,
  params: { token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log('query validateResetPasswordToken', { userId, token: params.token });

  const user = await modules.users.findUserByResetToken(params.token);

  return !!user;
}
