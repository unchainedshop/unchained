import { createFTS } from '@unchainedshop/store';

const workQueueFTS = createFTS({
  ftsTable: 'work_queue_fts',
  sourceTable: 'work_queue',
  columns: ['_id', 'originalWorkId', 'type', 'worker', 'input'],
});

export const setupWorkQueueFTS = workQueueFTS.setup;
export const searchWorkQueueFTS = workQueueFTS.search;
