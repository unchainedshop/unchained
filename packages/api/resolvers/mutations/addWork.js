import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function (
  root,
  { type, input, scheduled, original, retries },
  { userId }
) {
  log(`mutation addWork ${type} ${JSON.stringify(input)}`, { userId });

  return WorkerDirector.addWork({
    type,
    input,
    scheduled,
    original,
    retries,
  });
}
