import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default function (root, { workId }, { userId }) {
  log(`query work ${workId}`, { userId });

  return WorkerDirector.work({ workId });
}
