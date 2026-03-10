import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductNotFoundError } from '../../../errors.ts';

export default async function cancelEvent(
  root: never,
  { productId }: { productId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`mutation cancelEvent ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  // Use ticketing service if available
  if ((services as any).ticketing?.cancelTicketsForProduct) {
    return (services as any).ticketing.cancelTicketsForProduct(productId);
  }

  // Fallback: cancel all tokens for the product manually
  const tokensToCancel = await modules.warehousing.findTokens({
    productId,
    'meta.cancelled': null,
  });

  for (const token of tokensToCancel) {
    await modules.warehousing.invalidateToken(token._id);
    if ((modules as any).passes?.cancelTicket) {
      await (modules as any).passes.cancelTicket(token._id);
    }
  }

  return tokensToCancel.length;
}
