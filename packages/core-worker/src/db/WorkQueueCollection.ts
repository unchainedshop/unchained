import { Db } from '@unchainedshop/types/common';
import { Work } from '@unchainedshop/types/worker';
import { buildDbIndexes } from 'meteor/unchained:utils';

const ONE_DAY_IN_SECONDS = 86400;

export const WorkQueueCollection = async (db: Db) => {
  const WorkQueue = db.collection<Work>('work_queue');

  await buildDbIndexes<Work>(WorkQueue, [
    () =>
      WorkQueue.createIndex(
        {
          created: -1,
        },
        { expireAfterSeconds: 30 * ONE_DAY_IN_SECONDS }
      ),
    () => WorkQueue.createIndex({ started: -1 }),
    () => WorkQueue.createIndex({ finished: 1 }),
    () => WorkQueue.createIndex({ scheduled: 1 }),
    () => WorkQueue.createIndex({ priority: -1 }),
    () => WorkQueue.createIndex({ type: 1 }),
    () => WorkQueue.createIndex({ originalWorkId: 1 }),
  ]);

  return WorkQueue;
};
