import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function (
  root,
  { limit, offset, status = [] },
  { userId },
) {
  log(`query workQueue ${limit} ${offset} [${status.join(', ')}]`, { userId });

  return WorkerDirector.workQueue({ status, skip: offset, limit });
}
