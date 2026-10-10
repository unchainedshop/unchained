import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError } from '../../../errors.ts';

export default async function media(
  root: never,
  { mediaId }: { mediaId: string },
  { modules, userId }: Context,
) {
  log(`query media ${mediaId}`, { userId });

  if (!mediaId) throw new InvalidIdError({ mediaId });

  return modules.files.findFile({ fileId: mediaId });
}
