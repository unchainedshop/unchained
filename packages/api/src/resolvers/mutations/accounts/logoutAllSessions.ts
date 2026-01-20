import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function logoutAllSessions(root: never, _: never, context: Context) {
  const { userId, modules } = context;

  log('mutation logoutAllSessions', { userId });

  // Increment the user's tokenVersion to invalidate all existing JWT tokens
  // userId is guaranteed to be defined by ACL (loggedIn role)
  const result = await modules.users.incrementTokenVersion(userId!);

  if (!result) {
    throw new Error('Failed to logout all sessions', { cause: 'LOGOUT_FAILED' });
  }

  // Also logout the current session (clear the cookie)
  await context.logout();

  return {
    success: true,
    tokenVersion: result.tokenVersion,
  };
}
