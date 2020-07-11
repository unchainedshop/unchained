import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function (root, { type, input }, { userId }) {
  log(`mutation doWork ${type} ${input}`, {
    userId,
  });
  if (!type) throw new Error('Invalid work plugin type provided');
  return WorkerDirector.doWork({ type, input });
}
