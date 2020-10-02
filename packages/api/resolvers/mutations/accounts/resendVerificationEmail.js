import { Accounts } from 'meteor/accounts-base';

export default async function resendVerificationEmail(
  root,
  { email },
  { userId }
) {
  Accounts.sendVerificationEmail(userId, email);
  return {
    success: true,
  };
}
