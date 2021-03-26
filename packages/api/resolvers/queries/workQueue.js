import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function workQueue(
  root,
  {
    limit,
    offset,
    status = [],
    selectTypes = [],
    startDate,
    endDate = new Date(),
  },
  { userId }
) {
  log(`query workQueue ${limit} ${offset} [${status.join(', ')}]`, { userId });
  return WorkerDirector.workQueue({
    status,
    selectTypes,
    startDate,
    endDate,
    skip: offset,
    limit,
  });
}
