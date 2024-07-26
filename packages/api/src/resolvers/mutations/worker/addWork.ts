import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { WorkData } from '@unchainedshop/core-worker';

export default async function addWork(root: never, workData: WorkData, { modules, userId }: Context) {
  const { type, input } = workData;

  log(`mutation addWork ${type} ${JSON.stringify(input)}`, { userId });

  return modules.worker.addWork(workData);
}
