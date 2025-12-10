import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, WorkNotFoundOrWrongStatus } from '../../../errors.ts';

export default async function removeWork(
  root: never,
  { workId }: { workId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeWork ${workId}`, {
    userId,
  });

  if (!workId) throw new InvalidIdError({ workId });

  const work = await modules.worker.deleteWork(workId);

  if (!work) throw new WorkNotFoundOrWrongStatus({ workId });

  return work;
}
