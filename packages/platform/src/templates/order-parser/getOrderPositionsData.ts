import { Locale } from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Order } from '@unchainedshop/core-orders';
import formatPrice from './formatPrice.js';

type PriceFormatter = ({ amount, currency }: { amount: number; currency: string }) => string;

export const getOrderPositionsData = async (
  order: Order,
  params: { locale?: Locale; useNetPrice?: boolean; format?: PriceFormatter },
  context: UnchainedCore,
) => {
  const { modules } = context;
  const { useNetPrice, format = formatPrice } = params || {};
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
      const total = positionPricing.total({ useNetPrice });
      const unitPrice = positionPricing.unitPrice({ useNetPrice });

      const { quantity } = positionPricing;
      return {
        productId: orderPosition.productId,
        configuration: orderPosition.configuration,
        originalProductTexts,
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
