import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function failedLoginAttempts(
  _root: never,
  params: {
    userId?: string;
    remoteAddress?: string;
    since?: number;
  },
  context: Context,
) {
  log('query failedLoginAttempts', { userId: context.userId });

  if (!context.auditLog) return 0;

  return context.auditLog.getFailedLogins({
    userId: params.userId,
    remoteAddress: params.remoteAddress,
    since: params.since ? new Date(params.since) : undefined,
  });
}
