import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  TokenNotFoundError,
  ProductNotFoundError,
  TokenWrongStatusError,
} from '../../../errors.ts';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { WarehousingDirector } from '@unchainedshop/core';

export default async function invalidateToken(
  root: never,
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
  if (token.invalidatedDate) throw new TokenWrongStatusError({ tokenId });

  const product = await modules.products.findProduct({ productId: token.productId });
  if (!product) throw new ProductNotFoundError({ productId: token.productId });

  const virtualProviders = (await context.modules.warehousing.allProviders()).filter(
    ({ type }) => type === WarehousingProviderType.VIRTUAL,
  );

  const isInvalidateable = await WarehousingDirector.isInvalidateable(
    virtualProviders,
    {
      token,
      product,
      quantity: token?.quantity || 1,
      referenceDate: new Date(),
    },
    context,
  );

  if (!isInvalidateable) throw new TokenWrongStatusError({ tokenId });

  // The update only matches tokens that are still valid, so a concurrent
  // invalidation is reported like any other already invalidated token.
  const invalidatedToken = await modules.warehousing.invalidateToken(tokenId);
  if (!invalidatedToken) throw new TokenWrongStatusError({ tokenId });
  return invalidatedToken;
}
