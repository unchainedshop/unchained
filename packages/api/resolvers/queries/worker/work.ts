import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function work(
  root: Root,
  { workId }: { workId: string },
  { modules, userId }: Context,
) {
  log(`query work ${workId}`, { userId });

  if (!workId) throw new InvalidIdError({ workId });

  return modules.worker.findWork({ workId });
}
