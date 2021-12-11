import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, WorkNotFoundOrWrongStatus } from '../../../errors';

export default async function removeWork(
  root: Root,
  { workId }: { workId: string },
  { modules, userId }: Context
) {
  log(`mutation removeWork ${workId}`, {
    userId,
  });

  if (!workId) throw new InvalidIdError({ workId });

  const work = await modules.worker.deleteWork(workId, userId);

  if (!work) throw new WorkNotFoundOrWrongStatus({ workId });

  return work;
}
