import { log } from 'meteor/unchained:logger';
import { accountsServer } from 'meteor/unchained:core-accountsjs';

const logger = console;

export default async function logout(root, { token: hashedToken }, context) {
  log('mutation logout');
  try {
    await accountsServer.logout({
      token: hashedToken || accountsServer.hashLoginToken(context.loginToken),
      userId: context.userId,
    });
    return { success: true };
  } catch (e) {
    logger.error(e);
    return { success: false };
  }
}
