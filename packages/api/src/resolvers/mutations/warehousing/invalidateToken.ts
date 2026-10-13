import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  TokenNotFoundError,
  ProductNotFoundError,
  TokenWrongStatusError,
} from '../../../errors.ts';

export default async function invalidateToken(
  root: never,
  { tokenId }: { tokenId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`mutation invalidateToken ${tokenId}`, {
    userId,
  });

  if (!tokenId) throw new InvalidIdError({ tokenId });

  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) throw new TokenNotFoundError({ tokenId });
  if (token.invalidatedDate) throw new TokenWrongStatusError({ tokenId });

  const product = await modules.products.findProduct({ productId: token.productId });
  if (!product) throw new ProductNotFoundError({ productId: token.productId });

  if (!(await services.warehousing.isTokenInvalidateable({ token, product }))) {
    throw new TokenWrongStatusError({ tokenId });
  }

  // The update only matches tokens that are still valid, so a concurrent
  // invalidation is reported like any other already invalidated token.
  const invalidatedToken = await modules.warehousing.invalidateToken(tokenId);
  if (!invalidatedToken) throw new TokenWrongStatusError({ tokenId });
  return invalidatedToken;
}
