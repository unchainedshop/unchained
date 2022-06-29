import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { Work } from '@unchainedshop/types/worker';
import { WorkTypeInvalidError } from '../../../errors';

export default async function doWork(root: Root, work: Work, context: Context) {
  const { modules, userId } = context;
  const { type, input } = work;

  log(`mutation doWork ${type} ${input}`, {
    userId,
  });

  if (!type) throw new WorkTypeInvalidError({ type });

  return modules.worker.doWork(work, context);
}
