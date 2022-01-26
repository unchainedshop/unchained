import { Context, Root } from '@unchainedshop/types/api';
import { log, LogLevel } from 'meteor/unchained:logger';

export default async function logoutAllSessions(root: Root, _: any, context: Context) {
  const { modules, userId } = context;

  log('mutation logoutAllSessions', { userId });

  const loggedOut = await modules.accounts.logout({}, context);

  if (loggedOut.error)
    log('Error while logging out', {
      logLevel: LogLevel.Error,
      ...loggedOut.error,
    });

  return { success: loggedOut.success };
}
