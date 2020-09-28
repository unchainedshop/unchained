import { accountsServer } from 'meteor/unchained:core-accountsjs';

const logger = console;

export default async function logout(root, { token }, context) {
  try {
    await accountsServer.logout({ token, userId: context.userId });
    return { success: true };
  } catch (e) {
    logger.error(e);
    return { success: false };
  }
}
