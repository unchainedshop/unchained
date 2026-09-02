import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { UserNotFoundError } from '../../../errors.ts';

export default async function logoutAllSessions(
  root: never,
  params: { userId?: string },
  context: Context,
) {
  const { userId, modules } = context;
  const normalizedUserId = params.userId || userId;

  log(`mutation logoutAllSessions ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId! })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  // Increment the user's tokenVersion to invalidate all existing JWT tokens
  const result = await modules.users.incrementTokenVersion(normalizedUserId!);

  if (!result) {
    throw new Error('Failed to logout all sessions', { cause: 'LOGOUT_FAILED' });
  }

  // Only clear the current session cookie when logging out ourselves,
  // an admin force-logging-out another user keeps their own session
  if (normalizedUserId === userId) {
    await context.logout();
  }

  return { success: true };
}
