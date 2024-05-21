import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  TokenNotFoundError,
  ProductNotFoundError,
  TokenWrongStatusError,
} from '../../../errors.js';

export default async function invalidateToken(
  root: Root,
  { tokenId }: { tokenId: string },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation invalidateToken ${tokenId}`, {
    userId,
  });

  if (!tokenId) throw new InvalidIdError({ tokenId });

  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) throw new TokenNotFoundError({ tokenId });

  const product = await modules.products.findProduct({ productId: token.productId });
  if (!product) throw new ProductNotFoundError({ productId: token.productId });

  const isInvalidateable = await modules.warehousing.isInvalidateable(
    token.chainTokenId,
    {
      token,
      product,
      referenceDate: new Date(),
    },
    context,
  );

  if (!isInvalidateable) throw new TokenWrongStatusError({ tokenId });

  await modules.warehousing.invalidateToken(tokenId);
  return modules.warehousing.findToken({ tokenId });
}
