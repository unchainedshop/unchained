import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { Work } from '@unchainedshop/types/worker.js';
import { WorkTypeInvalidError } from '../../../errors.js';

export default async function doWork(root: Root, work: Work, context: Context) {
  const { modules, userId } = context;
  const { type, input } = work;

  log(`mutation doWork ${type} ${input}`, {
    userId,
  });

  if (!type) throw new WorkTypeInvalidError({ type });

  return modules.worker.doWork(work, context);
}
