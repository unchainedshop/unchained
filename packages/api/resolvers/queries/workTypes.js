import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function workTypes(root, { limit, offset }, { userId }) {
  log(`query workTypes ${limit} ${offset} `, { userId });

  return WorkerDirector.workTypes({
    skip: offset,
    limit,
  });
}
