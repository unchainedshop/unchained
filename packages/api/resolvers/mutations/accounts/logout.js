import { Accounts } from 'meteor/accounts-base';
import getConnection from '../../../getConnection';

export default async function(root, { token }, context) {
  if (token && context.userId) {
    const hashedToken = Accounts._hashLoginToken(token); // eslint-disable-line
    Accounts.destroyToken(context.userId, hashedToken);
  }
  const connection = getConnection();
  Accounts._successfulLogout(connection, context.userId); // eslint-disable-line
  return { success: true };
}
