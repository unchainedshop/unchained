import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function (root, workData, { userId }) {
  const { type, input } = workData;
  log(`mutation addWork ${type} ${JSON.stringify(input)}`, { userId });

  return WorkerDirector.addWork(workData);
}
