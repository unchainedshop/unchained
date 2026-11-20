import { ProductPricingSheet, type UnchainedCore } from '@unchainedshop/core';
import type { Order } from '@unchainedshop/core-orders';
import { getOrderPriceFormatter, type OrderDisplayOptions } from './getOrderPriceFormatter.ts';

export const getOrderPositionsData = async (
  order: Order,
  params: OrderDisplayOptions,
  { modules }: UnchainedCore,
) => {
  const format = getOrderPriceFormatter(params);
  const orderPositions = await modules.orders.positions.findOrderPositions({ orderId: order._id });
  const useNetPrice = params?.useNetPrice;

  return Promise.all(
    orderPositions.map(async ({ productId, configuration, quantity, calculation }) => {
      const productTexts = await modules.products.texts.findLocalizedText({
        productId,
        locale: params.locale,
      });
      const pricing = ProductPricingSheet({ calculation, currencyCode: order.currencyCode, quantity });
      const total = pricing.total({ useNetPrice });
      const unitPrice = pricing.unitPrice({ useNetPrice });

      return {
        productId,
        configuration,
        productTexts,
        quantity,
        rawPrices: { unitPrice, total },
        unitPrice: format(unitPrice),
        total: format(total),
      };
    }),
  );
};
