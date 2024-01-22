import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

export default async function logoutAllSessions(root: Root, _: any, context: Context) {
  const { userId } = context;

  log('mutation logoutAllSessions', { userId });
  // TODO: this should logout all sessions of a user
  // custom code to get sessions for passport userId
  // then express-session destroy

  await context.logout();

  return { success: true };
}
