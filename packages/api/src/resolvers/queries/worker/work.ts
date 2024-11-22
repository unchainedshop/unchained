import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { InvalidIdError } from '../../../errors.js';

export default async function work(
  root: never,
  { workId }: { workId: string },
  { modules, userId }: Context,
) {
  log(`query work ${workId}`, { userId });

  if (!workId) throw new InvalidIdError({ workId });

  return modules.worker.findWork({ workId });
}
