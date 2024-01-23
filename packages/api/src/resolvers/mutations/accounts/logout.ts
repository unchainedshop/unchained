import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

export default async function logout(root: Root, _: { token: string }, context: Context) {
  const { userId } = context;

  log('mutation logout', { userId });

  const success = await context.logout((context.req as any)?.sessionID);

  return { success };
}
