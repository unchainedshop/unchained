import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { Work } from '@unchainedshop/core-worker';

export default async function addWork(root: never, workData: Work, { modules, userId }: Context) {
  const { type, input } = workData;

  log(`mutation addWork ${type} ${JSON.stringify(input)}`, { userId });

  return modules.worker.addWork(workData);
}
