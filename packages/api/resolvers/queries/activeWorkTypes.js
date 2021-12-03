import { log } from 'meteor/unchained:logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function activeWorkTypes(root, _, { userId }) {
  log(`query activeWorkTypes  `, { userId });

  return WorkerDirector.activeWorkTypes();
}
