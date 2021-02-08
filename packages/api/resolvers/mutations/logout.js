import { log } from 'meteor/unchained:core-logger';
import { accountsServer } from 'meteor/unchained:core-accountsjs';

const logger = console;

export default async function logout(root, { token }, context) {
  log('mutation logout');
  try {
    await accountsServer.logout({
      token: token || context.loginToken,
      userId: context.userId,
    });
    return { success: true };
  } catch (e) {
    logger.error(e);
    return { success: false };
  }
}
