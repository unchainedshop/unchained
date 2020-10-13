import { accountsPassword } from 'meteor/unchained:core-accountsjs';

export default async function resendVerificationEmail(
  root,
  { email },
  { userId }
) {
  await accountsPassword.sendVerificationEmail(email);
  return {
    success: true,
  };
}
