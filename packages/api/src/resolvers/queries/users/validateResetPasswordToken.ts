import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function validateResetPasswordToken(
  root: never,
  params: { token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log('query validateResetPasswordToken', { userId, token: params.token });

  const resetToken = await modules.users.findResetToken(params.token);

  return !!resetToken;
}
