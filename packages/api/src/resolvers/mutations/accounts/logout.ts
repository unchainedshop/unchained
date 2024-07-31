import { Context, Root } from '@unchainedshop/types/api.js';
import { log, LogLevel } from '@unchainedshop/logger';

export default async function logout(root: Root, { token }: { token: string }, context: Context) {
  const { modules, userId, setLoginToken } = context;

  log('mutation logout', { userId });

  const loggedOut = await modules.accounts.logout(
    {
      token,
      loginToken: context.loginToken,
      userId: context.userId,
    },
    context,
  );

  if (loggedOut.error) {
    log('Error while logging out', {
      logLevel: LogLevel.Error,
      ...loggedOut.error,
    });
  } else {
    setLoginToken(context.res, null);
  }

  return { success: loggedOut.success };
}
