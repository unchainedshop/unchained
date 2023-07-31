import { UserNotFoundError } from '@unchainedshop/api/errors.js';
import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function stopImpersonation(root: Root, _, context: Context) {
  const { userId, modules, loginToken } = context;

  log(`mutation stopImpersonation for ${userId}`);

  const impersonatedUser = await modules.users.findUserById(userId);

  if (!impersonatedUser) throw new UserNotFoundError({ userId });
  const impersonator = impersonatedUser?.services?.resume?.loginTokens.find(
    ({ hashedToken, impersonatorId }) =>
      hashedToken === modules.accounts.createHashLoginToken(loginToken) && impersonatorId,
  );

  if (!impersonator) throw new Error('Current session is not being impersonated');

  await modules.accounts.logout({ loginToken }, context);

  const accountsServer = modules.accounts.getAccountsServer();

  const { token } = await accountsServer.loginWithUser(impersonator.impersonatorId);

  return {
    id: impersonator.impersonatorId,
    token: token.token,
    tokenExpires: token.when,
  };
}
