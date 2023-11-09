import { Locale } from '@unchainedshop/types/common.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Order } from '@unchainedshop/types/orders.js';
import formatPrice from './formatPrice.js';

export const getOrderPositionsData = async (
  order: Order,
  params: { locale?: Locale },
  context: UnchainedCore,
) => {
  const { modules } = context;
  const orderPositions = await modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });

  return Promise.all(
    orderPositions.map(async (orderPosition) => {
      const productTexts = await modules.products.texts.findLocalizedText({
        productId: orderPosition.productId,
        locale: params.locale?.normalized,
      });
      const originalProductTexts = await modules.products.texts.findLocalizedText({
        productId: orderPosition.originalProductId,
        locale: params.locale?.normalized,
      });

      const positionPricing = modules.orders.positions.pricingSheet(
        orderPosition,
        order.currency,
        context,
      );
      const total = formatPrice({
        amount: positionPricing.sum(),
        currency: order.currency,
      });

      const { quantity } = positionPricing;
      return {
        productId: orderPosition.productId,
        configuration: orderPosition.configuration,
        originalProductTexts,
        productTexts,
        quantity,
        total,
      };
    }),
  );
};
