/**
 * Logout All Sessions Mutation
 *
 * Invalidates all tokens for the current user across all devices.
 * This is useful for "Sign out everywhere" functionality.
 */

import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

interface LogoutAllSessionsResponse {
  success: boolean;
  sessionsRevoked: number;
}

export default async function logoutAllSessions(
  root: never,
  _: never,
  context: Context,
): Promise<LogoutAllSessionsResponse> {
  const { userId } = context;

  log('mutation logoutAllSessions', { userId });

  if (!userId) {
    throw new Error('Not authenticated', { cause: 'NOT_AUTHENTICATED' });
  }

  // Increment token version to invalidate all access tokens instantly
  await context.modules.users.incrementTokenVersion(userId);

  // Logout current session (clear cookies)
  await context.logout();

  return {
    success: true,
    sessionsRevoked: 1, // Token version increment invalidates all sessions
  };
}
