import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

export default async function logout(root: Root, _: { token: string }, context: Context) {
  const { userId } = context;

  log('mutation logout', { userId });
  // TODO: this should only logout this session or an explicitly provided session
  await context.logout();

  return { success: true };
}
