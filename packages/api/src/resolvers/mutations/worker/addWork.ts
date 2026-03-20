import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { Work } from '@unchainedshop/core-worker';

export default async function addWork(root: never, workData: Work, { modules, userId }: Context) {
  const { type, priority, retries, worker } = workData;

  log(`mutation addWork ${type}`, { userId, priority, retries, worker });

  return modules.worker.addWork(workData);
}
