import { accountsPassword } from 'meteor/unchained:core-accountsjs';
import hashPassword from '../../../hashPassword';

export default async function changePassword(
  root,
  {
    oldPassword: oldHashedPassword,
    oldPlainPassword,
    newPassword: newHashedPassword,
    newPlainPassword,
  },
  context,
) {
  if (!newHashedPassword && !newPlainPassword) {
    throw new Error('New password is required');
  }
  if (!oldHashedPassword && !oldPlainPassword) {
    throw new Error('Old password is required');
  }
  const newPassword = newHashedPassword || hashPassword(newPlainPassword);
  const oldPassword = oldHashedPassword || hashPassword(oldPlainPassword);

  return accountsPassword
    .changePassword(context.userId, oldPassword, newPassword)
    .then(() => {
      return {
        success: true,
      };
    });
}
