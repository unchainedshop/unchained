import { log } from 'meteor/unchained:logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { InvalidIdError } from '../../errors';

export default function work(root, { workId }, { userId }) {
  log(`query work ${workId}`, { userId });

  if (!workId) throw new InvalidIdError({ workId });
  return WorkerDirector.work({ workId });
}
