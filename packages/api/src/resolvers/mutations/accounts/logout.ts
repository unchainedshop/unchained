import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

export default async function logout(root: Root, _: never, context: Context) {
  const { userId } = context;

  log('mutation logout', { userId });

  const success = await context.logout();

  return { success };
}
