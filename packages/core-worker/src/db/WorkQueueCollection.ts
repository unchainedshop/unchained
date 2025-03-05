import { TimestampFields } from '@unchainedshop/mongodb';
import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';

const ONE_DAY_IN_SECONDS = 86400;

export enum WorkStatus {
  NEW = 'NEW',
  ALLOCATED = 'ALLOCATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export type Work = {
  _id?: string;
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
  worker?: string;
  autoscheduled?: boolean;
  scheduleId?: string;
} & TimestampFields;

export const WorkQueueCollection = async (db: mongodb.Db) => {
  const WorkQueue = db.collection<Work>('work_queue');

  await buildDbIndexes<Work>(WorkQueue, [
    {
      index: { created: -1 },
      options: { expireAfterSeconds: 30 * ONE_DAY_IN_SECONDS },
    },
    { index: { started: -1 } },
    { index: { finished: 1 } },
    { index: { scheduled: 1 } },
    { index: { priority: -1 } },
    { index: { type: 1 } },
    { index: { originalWorkId: 1 } },
    // {
    //   index: { originalWorkId: 'text', _id: 'text', worker: 'text', input: 'text', type: 'text' },
    //   options: {
    //     weights: {
    //       _id: 8,
    //       originalWorkId: 6,
    //       type: 5,
    //       worker: 4,
    //       input: 2,
    //     },
    //     name: 'workqueue_fulltext_search',
    //   },
    // },
  ]);

  return WorkQueue;
};
