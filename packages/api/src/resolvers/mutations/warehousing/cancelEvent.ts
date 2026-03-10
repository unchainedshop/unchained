import type { Context } from '../../../context.ts';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductNotFoundError, TicketingModuleNotFoundError } from '../../../errors.ts';

interface PassesModule {
  cancelTicket: (tokenId: string) => Promise<TokenSurrogate>;
}

interface TicketingServices {
  ticketing?: {
    cancelTicketsForProduct: (productId: string) => Promise<number>;
  };
}

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

  const passes = (modules as unknown as Record<string, unknown>).passes as PassesModule | undefined;
  if (!passes?.cancelTicket) {
    throw new TicketingModuleNotFoundError({});
  }

  const ticketingServices = services as unknown as TicketingServices;
  if (ticketingServices.ticketing?.cancelTicketsForProduct) {
    return ticketingServices.ticketing.cancelTicketsForProduct(productId);
  }

  // Cancel all tokens for the product
  const tokensToCancel = await modules.warehousing.findTokens({
    productId,
    'meta.cancelled': null,
  });

  for (const token of tokensToCancel) {
    await passes.cancelTicket(token._id);
  }

  return tokensToCancel.length;
}
