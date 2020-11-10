import { log } from 'meteor/unchained:core-logger';
import { accountsPassword } from 'meteor/unchained:core-accountsjs';

export default async function sendVerificationEmail(root, { email }) {
  log('mutation sendVerificationEmail', { email });
  await accountsPassword.sendVerificationEmail(email);
  return {
    success: true,
  };
}
