import { accountsPassword } from 'meteor/unchained:core-accountsjs';

export default async function forgotPassword(root, { email }) {
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
