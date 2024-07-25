import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { InvalidIdError } from '../../../errors.js';

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
