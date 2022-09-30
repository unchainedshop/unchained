import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function token(
  root: Root,
  { tokenId }: { tokenId: string },
  { modules, userId }: Context,
) {
  log(`query token ${tokenId}`, { userId });

  if (!tokenId) throw new InvalidIdError({ tokenId });

  return modules.warehousing.findToken({
    tokenId,
  });
}
