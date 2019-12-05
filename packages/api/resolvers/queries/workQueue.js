import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default function(root, { status = [] }, { userId }) {
  log(`query workQueue [${status.join(', ')}]`, { userId });

  return WorkerDirector.workQueue({ status });
}
