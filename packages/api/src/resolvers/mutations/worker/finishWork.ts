import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, WorkNotFoundOrWrongStatus } from '../../../errors.ts';

export default async function finishWork(
  root: never,
  data: {
    workId: string;
    error?: any;
    finished?: Date;
    result?: any;
    started?: Date;
    success: boolean;
    worker?: string;
  },
  { modules, userId }: Context,
) {
  const { workId, error, success, ...workData } = data;

  log(`mutation finishWork ${workId} ${success}`, {
    userId,
  });

  if (!workId) throw new InvalidIdError({ workId });

  const work = await modules.worker.finishWork(workId, {
    error,
    success,
    ...workData,
  });

  if (!work) throw new WorkNotFoundOrWrongStatus({ workId });

  return work;
}
