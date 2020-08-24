import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { WorkNotFoundError, InvalidIdError } from '../../errors';

export default function work(root, { workId }, { userId }) {
  log(`query work ${workId}`, { userId });
  if (!workId) throw new InvalidIdError({ workId });
  const foundWork = WorkerDirector.work({ workId });
  if (!foundWork) throw new WorkNotFoundError({ workId });
  return foundWork;
}
