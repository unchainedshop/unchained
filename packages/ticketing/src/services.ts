import { TicketingAPI } from './types.js';

const ticketingServices = {
  ticketing: {
    cancelTicketsForProduct: async (productId: string, context: TicketingAPI): Promise<number> => {
      const tokensToCancel = await context.modules.warehousing.findTokens({
        productId,
        'meta.cancelled': null,
      });

      for (const token of tokensToCancel) {
        await context.modules.warehousing.invalidateToken(token._id);
        await context.modules.passes.cancelTicket(token._id);
      }

      await context.modules.products.update(productId, {
        $set: { 'meta.cancelled': true },
      });

      return tokensToCancel.length;
    },
  },
};

export type TicketingServices = typeof ticketingServices;

export default ticketingServices;
