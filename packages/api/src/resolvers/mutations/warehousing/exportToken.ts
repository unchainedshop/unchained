import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { WorkStatus } from '@unchainedshop/core-worker';

import { InvalidIdError, TokenNotFoundError, TokenWrongStatusError } from '../../../errors.js';

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
  const workItems = await modules.worker.findWorkQueue({
    types: ['EXPORT_TOKEN'],
    status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
  });
  const existingWork = workItems.find((item) => item.input?.token?._id === token._id);
  if (!existingWork) {
    await modules.worker.addWork({
      type: 'EXPORT_TOKEN',
      retries: 5,
      input: {
        token,
        quantity,
        recipientWalletAddress,
      },
    });
  }

  return modules.warehousing.findToken({ tokenId });
}
