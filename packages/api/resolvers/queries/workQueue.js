import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function workQueue(
  root,
  { limit, offset, status = [], selectTypes = [], created },
  { userId }
) {
  log(
    `query workQueue ${limit} ${offset} [${status.join(', ')}] ${JSON.stringify(
      created
    )}`,
    { userId }
  );
  return WorkerDirector.workQueue({
    status,
    selectTypes,
    created,
    skip: offset,
    limit,
  });
}
