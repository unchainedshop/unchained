import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function doWork(root, { type, input }, { userId }) {
  log(`mutation doWork ${type} ${input}`, {
    userId,
  });

  return WorkerDirector.doWork({ type, input });
}
