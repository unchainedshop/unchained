import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function validateVerifyEmailToken(
  root: never,
  { token }: { token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log(`query validateVerifyEmailToken ${userId}`, { userId, token });

  const unverifiedToken = await modules.users.findUnverifiedEmailToken(token);

  return !!unverifiedToken;
}
