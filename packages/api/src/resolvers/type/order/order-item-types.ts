import type { Context } from '../../../context.ts';
import type { Order } from '@unchainedshop/core-orders';
import type { OrderPosition, OrderPositionDiscount } from '@unchainedshop/core-orders';
import type { Product } from '@unchainedshop/core-products';
import type { Quotation } from '@unchainedshop/core-quotations';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import type { Price } from '@unchainedshop/utils';
import { ProductPricingSheet } from '@unchainedshop/core';

const getPricingSheet = async (orderPosition: OrderPosition, { loaders }: Context) => {
  const order = await loaders.orderLoader.load({
    orderId: orderPosition.orderId,
  });
  return ProductPricingSheet({
    calculation: orderPosition.calculation,
    currencyCode: order.currencyCode,
    quantity: orderPosition.quantity,
  });
};

export const OrderItem = {
  async discounts(orderPosition: OrderPosition, _, context: Context): Promise<OrderPositionDiscount[]> {
    const pricing = await getPricingSheet(orderPosition, context);

    if (pricing.isValid()) {
      // IMPORTANT: Do not send any parameter to obj.discounts!
      return pricing.discountPrices().map((discount) => ({
        item: orderPosition,
        ...discount,
      }));
    }
    return [];
  },

  async dispatches(orderPosition: OrderPosition, _: never, { services }: Context) {
    return services.orders.resolveOrderItemDispatches({ orderPosition });
  },

  async order(orderPosition: OrderPosition, _, { loaders }: Context): Promise<Order> {
    return loaders.orderLoader.load({
      orderId: orderPosition.orderId,
    });
  },

  async originalProduct(orderPosition: OrderPosition, _, { loaders }: Context): Promise<Product> {
    const product = await loaders.productLoader.load({
      productId: orderPosition.originalProductId,
    });
    return product;
  },

  async product(orderPosition: OrderPosition, _, { loaders }: Context): Promise<Product> {
    const product = await loaders.productLoader.load({
      productId: orderPosition.productId,
    });
    return product;
  },

  async quotation(orderPosition: OrderPosition, _, { loaders }: Context): Promise<Quotation | null> {
    if (!orderPosition.quotationId) return null;
    return loaders.quotationLoader.load({ quotationId: orderPosition.quotationId });
  },

  async total(
    orderPosition: OrderPosition,
    params: { category: string; useNetPrice: boolean },
    context: Context,
  ): Promise<Price | null> {
    const pricing = await getPricingSheet(orderPosition, context);

    if (pricing.isValid()) {
      return pricing.total(params);
    }
    return null;
  },

  async unitPrice(
    orderPosition: OrderPosition,
    params: { useNetPrice: boolean },
    context: Context,
  ): Promise<Price | null> {
    const pricing = await getPricingSheet(orderPosition, context);

    if (pricing.isValid()) {
      return pricing.unitPrice(params);
    }
    return null;
  },

  async tokens(
    orderPosition: OrderPosition,
    params: never,
    { modules }: Context,
  ): Promise<TokenSurrogate[]> {
    return modules.warehousing.findTokens({
      orderPositionId: orderPosition._id,
    });
  },
};
