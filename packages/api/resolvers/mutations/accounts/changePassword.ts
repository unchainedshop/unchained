import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import hashPassword from '../../../hashPassword';

export default async function changePassword(
  root: Root,
  {
    oldPassword: oldHashedPassword,
    oldPlainPassword,
    newPassword: newHashedPassword,
    newPlainPassword,
  }: {
    oldPassword: string
    oldPlainPassword: string;
    newPassword: string
    newPlainPassword: string;
  },
  { modules, userId }: Context
) {
  log('mutation changePassword', { userId });

  if (!newHashedPassword && !newPlainPassword) {
    throw new Error('New password is required');
  }
  if (!oldHashedPassword && !oldPlainPassword) {
    throw new Error('Old password is required');
  }
  const newPassword = newHashedPassword || hashPassword(newPlainPassword);
  const oldPassword = oldHashedPassword || hashPassword(oldPlainPassword);

  await accountsPassword.changePassword(
    context.userId,
    oldPassword,
    newPassword
  );
  return { success: true };
}
