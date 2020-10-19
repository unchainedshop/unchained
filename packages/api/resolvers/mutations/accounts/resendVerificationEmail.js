import { log } from 'meteor/unchained:core-logger';
import { accountsPassword } from 'meteor/unchained:core-accountsjs';

export default async function resendVerificationEmail(root, { email }) {
  log('mutation resendVerificationEmail', { email });
  await accountsPassword.sendVerificationEmail(email);
  return {
    success: true,
  };
}
