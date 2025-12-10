import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError } from '../../../errors.ts';

export default async function work(
  root: never,
  { workId }: { workId: string },
  { modules, userId }: Context,
) {
  log(`query work ${workId}`, { userId });

  if (!workId) throw new InvalidIdError({ workId });

  return modules.worker.findWork({ workId });
}
