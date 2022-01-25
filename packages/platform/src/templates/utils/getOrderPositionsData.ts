import { Context } from '@unchainedshop/types/api';
import { Locale } from '@unchainedshop/types/common';
import { Order } from '@unchainedshop/types/orders';

export const getOrderPositionsData = async (
  order: Order,
  params: { locale: Locale },
  context: Context
) => {
  const { modules } = context;
  const orderPositions = await modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });

  const formatPrice = (price: number) => {
    const fixedPrice = price / 100;
    return `${order.currency} ${fixedPrice}`;
  };

  await Promise.all(
    orderPositions.map(async (orderPosition) => {
      const productTexts = await modules.products.texts.findLocalizedText({
        productId: orderPosition.productId,
        locale: params.locale.normalized,
      });
      const originalProductTexts =
        await modules.products.texts.findLocalizedText({
          productId: orderPosition.originalProductId,
          locale: params.locale.normalized,
        });

      const productTitle = productTexts?.title; // deprecated

      const positionPricing = modules.orders.positions.pricingSheet(
        orderPosition,
        order.currency,
        context
      );
      const total = formatPrice(positionPricing.sum());
      const { quantity } = positionPricing;
      return {
        originalProductTexts,
        product: productTitle,
        productTexts,
        quantity,
        total,
      };
    })
  );
};