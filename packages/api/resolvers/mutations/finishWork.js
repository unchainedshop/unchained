import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function (
  root,
  { workId, result, error, success, worker, started, finished },
  { userId }
) {
  log(`mutation finishWork ${workId} ${success} ${worker}`, {
    userId,
  });

  const work = WorkerDirector.finishWork({
    workId,
    result,
    error,
    success,
    worker,
    started,
    finished,
  });

  return work;
}
