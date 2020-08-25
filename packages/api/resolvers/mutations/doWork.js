import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { WorkTypeInvalidError } from '../../errors';

export default async function doWork(root, { type, input }, { userId }) {
  log(`mutation doWork ${type} ${input}`, {
    userId,
  });
  if (!type) throw new WorkTypeInvalidError({ type });
  return WorkerDirector.doWork({ type, input });
}
