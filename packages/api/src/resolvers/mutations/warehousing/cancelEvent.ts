import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { ProductStatus } from '@unchainedshop/core-products';
import {
  InvalidIdError,
  ProductNotFoundError,
  ProductWrongStatusError,
  TicketingModuleNotFoundError,
} from '../../../errors.ts';


export default async function cancelEvent(
  root: never,
  { productId, generateDiscount }: { productId: string; generateDiscount?: boolean },
  context: Context,
) {
  const { modules, services, userId, countryCode, currencyCode } = context;
  log(`mutation cancelEvent ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.status !== ProductStatus.ACTIVE) {
    throw new ProductWrongStatusError({ productId });
  }

  const passes = (modules as unknown as Record<string, unknown>).passes as any
  if (!passes?.cancelTicket) {
    throw new TicketingModuleNotFoundError({});
  }

  const ticketingServices = (services as unknown as any).ticketing;
  if (!ticketingServices?.cancelTicketsForProduct) {
    throw new TicketingModuleNotFoundError({});
  }

  const result = await ticketingServices.cancelTicketsForProduct(productId, {
    generateDiscount,
    countryCode,
    currencyCode,
  });

  if (result.discountCodes?.length) {
    await Promise.allSettled(
      result.discountCodes.map(async ({ userId: ticketUserId, discountCode, amount }) => {
        await modules.worker.addWork({
          type: 'MESSAGE',
          input: {
            template: 'EVENT_CANCELLED',
            productId,
            userId: ticketUserId,
            discountCode,
            discountAmount: amount,
          },
        });
      }),
    );
  }

  return result.cancelledCount;
}
