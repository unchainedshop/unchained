import type { Context } from '@unchainedshop/api';
import { InvalidIdError, TokenNotFoundError, TokenWrongStatusError } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { isActiveTicketEvent } from '../../roles.ts';

export default async function scanTicket(
  _root: never,
  { tokenId }: { tokenId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`mutation scanTicket ${tokenId}`, { userId });
  if (!tokenId) throw new InvalidIdError({ tokenId });
  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) throw new TokenNotFoundError({ tokenId });
  const product = await modules.products.findProduct({ productId: token.productId });
  if (
    !isActiveTicketEvent(product) ||
    product.meta?.cancelled ||
    token.meta?.cancelled ||
    token.invalidatedDate ||
    !(await services.warehousing.isTokenInvalidateable({ token, product }))
  ) {
    throw new TokenWrongStatusError({ tokenId });
  }
  // The update only matches tokens that are still valid, so a concurrent scan
  // at another gate is reported as an already redeemed ticket.
  const redeemedToken = await modules.warehousing.invalidateToken(tokenId);
  if (!redeemedToken) throw new TokenWrongStatusError({ tokenId });
  return redeemedToken;
}
