import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

export default async function logoutAllSessions(root: Root, _: any, context: Context) {
  const { userId } = context;

  log('mutation logoutAllSessions', { userId });
  await context.logout();

  return { success: true };
}
