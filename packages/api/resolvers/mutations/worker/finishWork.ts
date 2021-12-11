import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, WorkNotFoundOrWrongStatus } from '../../../errors';

export default async function finishWork(
  root: Root,
  data: {
    workId: string;
    error?: any;
    finished: Date;
    result?: any;
    started?: Date;
    success: boolean;
    worker: string;
  },
  { modules, userId }: Context
) {
  const { workId, error, finished, result, started, success, worker } = data;

  log(`mutation finishWork ${workId} ${success} ${worker}`, {
    userId,
  });

  if (!workId) throw new InvalidIdError({ workId });

  const work = await modules.worker.finishWork(
    workId,
    {
      result,
      error,
      success,
      worker,
      started,
      finished,
    },
    userId
  );

  if (!work) throw new WorkNotFoundOrWrongStatus({ workId });

  return work;
}
