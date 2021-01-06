import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function workTypes(root, _, { userId }) {
  log(`query workTypes  `, { userId });

  return WorkerDirector.workTypes();
}
