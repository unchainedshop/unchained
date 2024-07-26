import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { Work } from '../types.js';

const ONE_DAY_IN_SECONDS = 86400;

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

  return WorkQueue;
};
