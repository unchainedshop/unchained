import { Context, Root } from '@unchainedshop/types/api.js';
import { log, LogLevel } from '@unchainedshop/logger';

export default async function logoutAllSessions(root: Root, _: any, context: Context) {
  const { modules, userId, setLoginToken } = context;

  log('mutation logoutAllSessions', { userId });

  const loggedOut = await modules.accounts.logout(
    {
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
