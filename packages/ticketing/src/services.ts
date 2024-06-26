import { TicketingAPI } from './types.js';

const ticketingServices = {
  ticketing: {
    cancelToken: async (tokenId, generateDiscount = false, context: TicketingAPI) => {
      const { modules } = context;
      const token = await TokenSurrogates.findOne({
        _id: tokenId,
        'meta.cancelled': { $ne: true },
      });
      if (!token) return;

      const product = await modules.products.findProduct({
        productId: token.productId,
      });
      const price = await modules.products.prices.price(product, {
        country: 'CH',
        currency: 'CHF',
      });

      await modules.warehousing.invalidateToken(tokenId);
      await TokenSurrogates.updateOne({ _id: tokenId }, { $set: { 'meta.cancelled': true } });
      if (generateDiscount) {
        const discountCode = await generateDiscountCode(price.amount);
        await context.modules.worker.addWork({
          type: 'MESSAGE',
          input: {
            template: ExtendedMessageTypes.TICKET_CANCELLED,
            discountCode,
            discountAmount: price.amount,
            tokenId: token._id,
          },
        });
      }
    },
    cancelTokens: async (productId, generateDiscount = false, context: TicketingAPI) => {
      const orderPositions = await OrderPositions.find({ productId }).toArray();

      const refundableUserOrders = {};
      const product = await context.modules.products.findProduct({ productId });
      const price = await context.modules.products.prices.price(product, {
        country: 'CH',
        currency: 'CHF',
      });

      for await (const orderPosition of orderPositions) {
        const order = await context.modules.orders.findOrder({
          orderId: orderPosition.orderId,
        });
        if (order) {
          if (refundableUserOrders[order.userId]) {
            refundableUserOrders[order.userId] += price.amount * orderPosition.quantity;
          } else {
            refundableUserOrders[order.userId] = price.amount * orderPosition.quantity;
          }
        }
      }

      const tokens = await TokenSurrogates.find({ productId }).toArray();
      await TokenSurrogates.updateMany({ productId }, { $set: { 'meta.cancelled': true } });
      for (const token of tokens) {
        await context.modules.warehousing.invalidateToken(token._id);
      }
      await context.modules.products.update(productId, {
        $set: { 'meta.cancelled': true },
      });

      if (generateDiscount) {
        for await (const [userId, totalDiscountAmount] of Object.entries(refundableUserOrders)) {
          const discountCode = await generateDiscountCode(totalDiscountAmount);
          await context.modules.worker.addWork({
            type: 'MESSAGE',
            input: {
              template: ExtendedMessageTypes.EVENT_CANCELLED,
              discountCode,
              discountAmount: totalDiscountAmount,
              productId,
              userId,
            },
          });
        }
      }

      return true;
    },
  },
};

export type TicketingServices = typeof ticketingServices;

export default ticketingServices;
