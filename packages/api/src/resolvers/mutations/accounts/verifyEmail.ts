import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function verifyEmail(root: Root, { token }: { token: any }, context: Context) {
  const { modules, userId } = context;

  log(`mutation verifyEmail ${userId}`, { userId });

  const unverifiedUser = await modules.accounts.findUnverifiedUserByToken(token);

  await modules.accounts.verifyEmail(token);
  const verifiedUser = await modules.users.findUserById(unverifiedUser.id);
  await modules.accounts.emit('VerifyEmailSuccess', verifiedUser);

  const tokenData = await modules.accounts.createLoginToken(unverifiedUser.id, context);

  return tokenData;
}
