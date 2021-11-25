import { log } from 'meteor/unchained:logger';
import { accountsServer } from 'meteor/unchained:core-accountsjs';

const logger = console;

export default async function logoutAllSessions(root, _, context) {
  log('mutation logoutAllSessions');
  try {
    await accountsServer.logout({
      userId: context.userId,
    });
    return { success: true };
  } catch (e) {
    logger.error(e);
    return { success: false };
  }
}
