import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function auditLogsCount(
  _root: never,
  params: {
    classUids?: number[];
    userId?: string;
    success?: boolean;
    from?: number;
    until?: number;
  },
  context: Context,
) {
  log('query auditLogsCount', { userId: context.userId });

  if (!context.auditLog) return 0;

  return context.auditLog.count({
    classUids: params.classUids,
    userId: params.userId,
    success: params.success ?? undefined,
    startTime: params.from ? new Date(params.from) : undefined,
    endTime: params.until ? new Date(params.until) : undefined,
  });
}
