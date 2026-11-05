import { type TimestampFields } from '@unchainedshop/mongodb';
import { type mongodb, buildDbIndexes } from '@unchainedshop/mongodb';

const ONE_DAY_IN_SECONDS = 86400;

// Work is kept for 30 days after it was created or is scheduled to run, whichever is later.
export const WORK_RETENTION_SECONDS = 30 * ONE_DAY_IN_SECONDS;

export const computeWorkExpiry = ({
  created,
  scheduled,
}: {
  created?: Date;
  scheduled?: Date | null;
}): Date => {
  const times = [created, scheduled]
    .map((date) => (date ? new Date(date).getTime() : NaN))
    .filter(Number.isFinite);
  const latest = times.length ? Math.max(...times) : Date.now();
  return new Date(latest + WORK_RETENTION_SECONDS * 1000);
};

export const WorkStatus = {
  NEW: 'NEW',
  ALLOCATED: 'ALLOCATED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  DELETED: 'DELETED',
} as const;

export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus];

export type Work = {
  _id: string;
  priority: number;
  retries: number;
  scheduled: Date;
  type: string;
  input: Record<string, any>;
  error?: any;
  finished?: Date;
  originalWorkId?: string;
  result?: any;
  started?: Date;
  success?: boolean;
  timeout?: number;
  worker?: string | null;
  autoscheduled?: boolean;
  scheduleId?: string;
  // The TTL index deletes the work at this date, see computeWorkExpiry
  expires?: Date;
} & TimestampFields;

export const WorkQueueCollection = async (db: mongodb.Db) => {
  const WorkQueue = db.collection<Work>('work_queue');

  await buildDbIndexes<Work>(WorkQueue, [
    {
      index: { originalWorkId: 'text', _id: 'text', worker: 'text', input: 'text', type: 'text' },
      options: {
        weights: {
          _id: 8,
          originalWorkId: 6,
          type: 5,
          worker: 4,
          input: 2,
        },
        name: 'workqueue_fulltext_search',
      },
    },
  ]);

  await buildDbIndexes<Work>(WorkQueue, [
    { index: { expires: 1 }, options: { expireAfterSeconds: 0 } },
    // Ascending: older versions have a TTL index `created_-1` until migration 20261104120000 drops
    // it, and `{ created: -1 }` without TTL would conflict with it (buildDbIndexes would then drop
    // and rebuild every index of the collection).
    { index: { created: 1 } },
    // `status` is derived from started/finished/deleted via WORK_STATUS_FILTER_MAP — index the stored fields, not status.
    { index: { scheduled: 1, type: 1 } },
    { index: { type: 1 } },
    { index: { originalWorkId: 1 } },
    { index: { started: 1 }, options: { sparse: true } },
    { index: { finished: 1 }, options: { sparse: true } },
    { index: { priority: -1 } },
  ]);

  return WorkQueue;
};
