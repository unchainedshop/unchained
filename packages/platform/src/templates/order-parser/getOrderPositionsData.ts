import { UnchainedCore } from '@unchainedshop/core';
import { Order } from '@unchainedshop/core-orders';
import formatPrice from './formatPrice.js';
import { ProductPricingSheet } from '@unchainedshop/core-products';

type PriceFormatter = ({ amount, currency }: { amount: number; currency: string }) => string;

export const getOrderPositionsData = async (
  order: Order,
  params: { locale?: Intl.Locale; useNetPrice?: boolean; format?: PriceFormatter },
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
        locale: params.locale?.baseName,
      });

      const positionPricing = ProductPricingSheet({
        calculation: orderPosition.calculation,
        currency: order.currency,
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
