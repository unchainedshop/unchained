import { log } from 'meteor/unchained:logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function addWork(root, workData, { userId }) {
  const { type, input } = workData;
  log(`mutation addWork ${type} ${JSON.stringify(input)}`, { userId });

  return WorkerDirector.addWork(workData);
}
