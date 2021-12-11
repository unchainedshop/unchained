import { log } from 'meteor/unchained:logger';
import { WorkTypeInvalidError } from '../../../errors';
import { Context, Root } from '@unchainedshop/types/api';
import { Work } from '@unchainedshop/types/worker';

export default async function doWork(
  root: Root,
  work: Work,
  { modules, userId }: Context
) {
  const { type, input } = work;

  log(`mutation doWork ${type} ${input}`, {
    userId,
  });

  if (!type) throw new WorkTypeInvalidError({ type });

  return await modules.worker.doWork(work);
}
