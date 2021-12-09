import { Db } from '@unchainedshop/types/common';
import { WorkQueue } from '@unchainedshop/types/worker';
import { buildDbIndexes } from 'meteor/unchained:utils';

const ONE_DAY_IN_SECONDS = 86400;

export const WorkQueuesCollection = async (db: Db) => {
  const WorkQueues = db.collection<WorkQueue>('work_queue');

  await buildDbIndexes<WorkQueue>(WorkQueues, [
    () =>
      WorkQueues.createIndex(
        {
          created: -1,
        },
        { expireAfterSeconds: 30 * ONE_DAY_IN_SECONDS }
      ),
    () => {
      WorkQueues.createIndex({ started: -1 });
      WorkQueues.createIndex({ finished: 1 });
      WorkQueues.createIndex({ scheduled: 1 });
      WorkQueues.createIndex({ priority: -1 });
      WorkQueues.createIndex({ type: 1 });
      WorkQueues.createIndex({ originalWorkId: 1 });
    },
  ]);

  return WorkQueues;
};
