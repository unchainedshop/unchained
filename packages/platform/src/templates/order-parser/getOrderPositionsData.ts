import type { UnchainedCore } from '@unchainedshop/core';
import type { Order } from '@unchainedshop/core-orders';
import { ProductPricingSheet } from '@unchainedshop/core';
import { getOrderPriceFormatter, type OrderDisplayOptions } from './getOrderPriceFormatter.ts';

export const getOrderPositionsData = async (
  order: Order,
  params: OrderDisplayOptions,
  context: UnchainedCore,
) => {
  const { modules } = context;
  const {
    useNetPrice,
    format = await getOrderPriceFormatter(order.currencyCode, params?.locale, context),
  } = params || {};
  const orderPositions = await modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });

  return Promise.all(
    orderPositions.map(async (orderPosition) => {
      const productTexts = await modules.products.texts.findLocalizedText({
        productId: orderPosition.productId,
        locale: params.locale,
      });

      const positionPricing = ProductPricingSheet({
        calculation: orderPosition.calculation,
        currencyCode: order.currencyCode,
        quantity: orderPosition.quantity,
      });

      const total = positionPricing.total({ useNetPrice });
      const unitPrice = positionPricing.unitPrice({ useNetPrice });

      const { quantity } = positionPricing;
      return {
        productId: orderPosition.productId,
        configuration: orderPosition.configuration,
        productTexts,
        quantity,
        rawPrices: {
          unitPrice,
          total,
        },
        unitPrice: format(unitPrice),
        total: format(total),
      };
    }),
  );
};
