import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { WorkNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { workId }, { userId }) {
  log(`query work ${workId}`, { userId });

  if (!workId) throw new InvalidIdError({ workId });
  const work = WorkerDirector.work({ workId });
  if (!work) throw new WorkNotFoundError({ workId });

  return work;
}
