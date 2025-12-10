import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError } from '../../../errors.ts';

export default async function token(
  root: never,
  { tokenId }: { tokenId: string },
  { modules, userId }: Context,
) {
  log(`query token ${tokenId}`, { userId });

  if (!tokenId) throw new InvalidIdError({ tokenId });

  return modules.warehousing.findToken({
    tokenId,
  });
}
