import type { TicketingModule } from './module.ts';
import type { Bound, UnchainedCore } from '@unchainedshop/core';

async function cancelTicketsForProduct(
  this: TicketingModule & UnchainedCore['modules'],
  productId: string,
): Promise<number> {
  const tokensToCancel = await this.warehousing.findTokens({
    productId,
    'meta.cancelled': null,
  });

  for (const token of tokensToCancel) {
    await this.warehousing.invalidateToken(token._id);
    await this.passes.cancelTicket(token._id);
  }

  const product = await this.products.findProduct({ productId });
  if (product) {
    const currentMeta = (product.meta as Record<string, unknown>) || {};
    await this.products.update(productId, {
      meta: { ...currentMeta, cancelled: true },
    });
  }

  return tokensToCancel.length;
}

export default {
  ticketing: {
    cancelTicketsForProduct,
  },
};

export interface TicketingServices {
  ticketing: {
    cancelTicketsForProduct: Bound<typeof cancelTicketsForProduct>;
  };
}
