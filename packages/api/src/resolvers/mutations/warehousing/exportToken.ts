import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

import { InvalidIdError, TokenNotFoundError, TokenWrongStatusError } from '../../../errors.ts';

export default async function exportToken(
  root: never,
  {
    tokenId,
    quantity,
    recipientWalletAddress,
  }: { tokenId: string; quantity: number; recipientWalletAddress: string },
  { modules, userId }: Context,
) {
  log(`mutation exportToken ${tokenId}`, {
    userId,
  });

  if (!tokenId) throw new InvalidIdError({ tokenId });

  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) throw new TokenNotFoundError({ tokenId });

  if (token.walletAddress && !token.userId) {
    throw new TokenWrongStatusError({ tokenId });
  }

  await modules.worker.addWorkIfNotExists(
    {
      type: 'EXPORT_TOKEN',
      retries: 5,
      input: {
        token,
        quantity,
        recipientWalletAddress,
      },
    },
    (item) => item.input?.token?._id === token._id,
  );

  return modules.warehousing.findToken({ tokenId });
}
