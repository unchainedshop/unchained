import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors';

export default async function exportToken(
  root: Root,
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

  if (token) {
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
