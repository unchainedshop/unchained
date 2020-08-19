import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { WorkNotFoundOrWrongStatus, InvalidIdError } from '../../errors';

export default async function (
  root,
  { workId, result, error, success, worker, started, finished },
  { userId },
) {
  log(`mutation finishWork ${workId} ${success} ${worker}`, {
    userId,
  });

  if (!workId) throw new InvalidIdError({ workId });
  const work = await WorkerDirector.finishWork({
    workId,
    result,
    error,
    success,
    worker,
    started,
    finished,
  });
  if (!work) throw new WorkNotFoundOrWrongStatus({ workId });
  return work;
}
