import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function changePassword(
  root: Root,
  params: {
    oldPlainPassword?: string;
    newPlainPassword?: string;
  },
  { modules, userId }: Context,
) {
  log('mutation changePassword', { userId });

  if (!params.newPlainPassword) {
    throw new Error('New password is required');
  }
  if (!params.oldPlainPassword) {
    throw new Error('Old password is required');
  }

  const success = await modules.accounts.changePassword(userId, params);

  return { success };
}
