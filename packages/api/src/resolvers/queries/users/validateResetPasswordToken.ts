import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function validateResetPasswordToken(
  root: never,
  params: { token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log('query validateResetPasswordToken', { userId, token: params.token });

  const user = await modules.users.findUserByResetToken(params.token);

  return !!user;
}
