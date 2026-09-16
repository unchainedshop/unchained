import type { Context } from '@unchainedshop/api';
import {
  InvalidIdError,
  NoPermissionError,
  TokenNotFoundError,
  TokenWrongStatusError,
} from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { isActiveTicketEvent } from '../../roles.ts';

export default async function scanTicket(
  _root: never,
  { tokenId }: { tokenId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  if (!userId || !context.user || context.user.guest) {
    throw new NoPermissionError({ action: 'scanTicket' });
  }
  log(`mutation scanTicket ${tokenId}`, { userId });
  if (!tokenId) throw new InvalidIdError({ tokenId });
  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) throw new TokenNotFoundError({ tokenId });
  const product = await modules.products.findProduct({ productId: token.productId });
  if (
    !isActiveTicketEvent(product) ||
    product?.meta?.cancelled ||
    token.meta?.cancelled ||
    token.invalidatedDate ||
    !(await services.warehousing.isTokenInvalidateable({ token, product }))
  ) {
    throw new TokenWrongStatusError({ tokenId });
  }
  return modules.warehousing.invalidateToken(tokenId);
}
