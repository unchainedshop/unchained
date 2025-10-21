import { Context } from '../../../context.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Order } from '@unchainedshop/core-orders';
import { OrderPosition, OrderPositionDiscount } from '@unchainedshop/core-orders';
import { Product } from '@unchainedshop/core-products';
import { Quotation } from '@unchainedshop/core-quotations';
import { TokenSurrogate, WarehousingProvider } from '@unchainedshop/core-warehousing';
import { Price } from '@unchainedshop/utils';
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

  async dispatches(
    orderPosition: OrderPosition,
    _: never,
    { modules, loaders }: Context,
  ): Promise<
    | {
        _id: string;
        deliveryProvider: DeliveryProvider;
        warehousingProvider: WarehousingProvider;
        shipping: Date;
        earliestDelivery: Date;
      }[]
    | null
  > {
    const scheduling = orderPosition.scheduling || [];
    const order = await loaders.orderLoader.load({
      orderId: orderPosition.orderId,
    });
    const { countryCode, userId } = order;

    const orderDelivery =
      order.deliveryId &&
      (await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      }));

    if (!orderDelivery) return null;

    const deliveryProvider = await loaders.deliveryProviderLoader.load({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    });
    const product = await loaders.productLoader.load({
      productId: orderPosition.productId,
    });

    if (!deliveryProvider || !product) return null;

    return Promise.all(
      scheduling.map(async (schedule) => {
        const warehousingProvider = await loaders.warehousingProviderLoader.load({
          warehousingProviderId: schedule.warehousingProviderId,
        });

        const context = {
          warehousingProvider,
          deliveryProvider,
          product,
          quantity: orderPosition.quantity,
          countryCode,
          userId,
          // referenceDate,
        };
        return {
          ...context,
          ...schedule,
        };
      }),
    );
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

  async quotation(orderPosition: OrderPosition, _, { modules }: Context): Promise<Quotation | null> {
    if (!orderPosition.quotationId) return null;
    // TODO: use quotation loader
    return modules.quotations.findQuotation({ quotationId: orderPosition.quotationId });
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
