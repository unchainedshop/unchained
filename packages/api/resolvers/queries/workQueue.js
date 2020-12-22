import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function workQueue(
  root,
  { limit, offset, status = [], type = [] },
  { userId }
) {
  log(`query workQueue ${limit} ${offset} [${status.join(', ')}]`, { userId });
  return WorkerDirector.workQueue({ status, type, skip: offset, limit });
}
