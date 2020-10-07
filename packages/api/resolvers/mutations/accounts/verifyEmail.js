import { accountsPassword } from 'meteor/unchained:core-accountsjs';

export default async function verifyEmail(root, { token }, context) {
  await accountsPassword.verifyEmail(token);
}
