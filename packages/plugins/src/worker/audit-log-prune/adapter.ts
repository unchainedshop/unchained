import { type IWorkerAdapter, WorkerAdapter, WorkerDirector, schedule } from '@unchainedshop/core';
import { getAuditLogInstance } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:worker:audit-log-prune');

const everyDayAtThreeAM = schedule.parse.cron('0 3 * * *');

interface Result {
  removed: number;
}

export const AuditLogPrune: IWorkerAdapter<Record<string, never>, Result> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.audit-log-prune',
  label: 'Prune expired audit log files',
  version: '1.0.0',
  type: 'AUDIT_LOG_PRUNE',
  maxParallelAllocations: 1,

  doWork: async (): Promise<{ success: boolean; result: Result }> => {
    const auditLog = getAuditLogInstance();
    if (!auditLog) {
      return { success: true, result: { removed: 0 } };
    }
    const removed = await auditLog.prune();
    if (removed > 0) {
      logger.info(`Pruned ${removed} expired audit log file(s)`);
    }
    return { success: true, result: { removed } };
  },
};

export default AuditLogPrune;

export const configureAuditLogPruneAutoscheduling = () => {
  WorkerDirector.configureAutoscheduling({
    type: AuditLogPrune.type,
    schedule: everyDayAtThreeAM,
    retries: 3,
  });
};
