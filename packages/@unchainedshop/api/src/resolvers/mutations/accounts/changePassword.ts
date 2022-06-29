import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function changePassword(
  root: Root,
  params: {
    oldPassword?: string;
    oldPlainPassword?: string;
    newPassword?: string;
    newPlainPassword?: string;
  },
  { modules, userId }: Context,
) {
  log('mutation changePassword', { userId });

  if (!params.newPassword && !params.newPlainPassword) {
    throw new Error('New password is required');
  }
  if (!params.oldPassword && !params.oldPlainPassword) {
    throw new Error('Old password is required');
  }

  const success = await modules.accounts.changePassword(userId, params);

  return { success };
}
