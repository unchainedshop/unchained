import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default function (
  root,
  { type, input, scheduled, original, retries },
  { userId }
) {
  log(`mutation addWork ${type} ${JSON.stringify(input)}`, { userId });

  const work = WorkerDirector.addWork({
    type,
    input,
    scheduled,
    original,
    retries,
  });
  return work;
}
