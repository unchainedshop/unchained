import { UnchainedCore } from '@unchainedshop/core';
import { Order } from '@unchainedshop/core-orders';
import { ProductPricingSheet } from '@unchainedshop/core';
import { ch } from '@unchainedshop/utils';

type PriceFormatter = ({ amount, currencyCode }: { amount: number; currencyCode: string }) => string;

export const getOrderPositionsData = async (
  order: Order,
  params: { locale: Intl.Locale; useNetPrice?: boolean; format?: PriceFormatter },
  context: UnchainedCore,
) => {
  const { modules } = context;
  const { useNetPrice, format = ch.priceToString } = params || {};
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
