import { TicketingModule } from './module.js';
import { Bound, UnchainedCore } from '@unchainedshop/core';

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

  await this.products.update(productId, {
    $set: { 'meta.cancelled': true },
  });

  return tokensToCancel.length;
}

export default {
  ticketing: {
    cancelTicketsForProduct,
  },
};

export type TicketingServices = {
  ticketing: {
    cancelTicketsForProduct: Bound<typeof cancelTicketsForProduct>;
  };
};
