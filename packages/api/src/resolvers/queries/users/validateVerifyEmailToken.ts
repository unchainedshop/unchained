import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function validateVerifyEmailToken(
  root: Root,
  { token }: { token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log(`query validateVerifyEmailToken ${userId}`, { userId, token });

  const unverifiedToken = await modules.users.findUserByToken({ verifyEmailToken: token });

  return !!unverifiedToken;
}
