import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

export default async function logout(root: Root, { token }: { token: string }, context: Context) {
  const { userId } = context;

  log('mutation logout', { userId });
  await context.logout();

  return { success: true };
}
