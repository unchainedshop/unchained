import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { WorkNotFoundOrWrongStatus, InvalidIdError } from '../../errors';

export default async function (root, { workId }, { userId }) {
  log(`mutation removeWork ${workId}`, {
    userId,
  });
  if (!workId) throw new InvalidIdError({ workId });
  const work = await WorkerDirector.removeWork({
    workId,
  });
  if (!work) throw new WorkNotFoundOrWrongStatus({ workId });
  return work;
}
