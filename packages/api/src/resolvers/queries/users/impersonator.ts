import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function impersonator(
  root: Root,
  params: any,
  { userId, user, remoteAddress, modules, loginToken }: Context,
) {
  log(`query impersonator ${remoteAddress}`, { userId });
  if (!user?.services || !user?.services?.resume || !user?.services?.resume?.loginTokens) return null;

  const { loginTokens } = user.services.resume;
  const impersonatedSession = loginTokens.find(
    ({ hashedToken, impersonatorId }) =>
      hashedToken === modules.accounts.createHashLoginToken(loginToken) && impersonatorId,
  );
  if (!impersonatedSession) return null;
  return modules.users.findUserById(impersonatedSession.impersonatorId);
}
