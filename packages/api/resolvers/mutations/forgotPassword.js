import { log } from 'unchained-logger';
import { accountsPassword } from 'meteor/unchained:core-accountsjs';

export default async function forgotPassword(root, { email }) {
  log('mutation forgotPassword', { email });
  try {
    await accountsPassword.sendResetPasswordEmail(email);
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
    };
  }
}
