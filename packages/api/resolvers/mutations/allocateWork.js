import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default async function allocateWork(
  root,
  { types, worker },
  { userId }
) {
  log(`mutation allocateWork ${(types || []).join(',')} ${worker}`, {
    userId,
  });

  const work = await WorkerDirector.allocateWork({ types, worker });
  return work;
}
