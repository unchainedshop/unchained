import { Context } from '../../../context.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Order } from '@unchainedshop/core-orders';
import { OrderPosition, OrderPositionDiscount } from '@unchainedshop/core-orders';
import { Product } from '@unchainedshop/core-products';
import { Quotation } from '@unchainedshop/core-quotations';
import { TokenSurrogate, WarehousingProvider } from '@unchainedshop/core-warehousing';
import { Price } from '@unchainedshop/utils';
import { ProductPricingSheet } from '@unchainedshop/core';

const getPricingSheet = async (orderPosition: OrderPosition, context: Context) => {
  const { modules } = context;

  // TODO: use order loader
  const order = await modules.orders.findOrder({
    orderId: orderPosition.orderId,
  });
  return ProductPricingSheet({
    calculation: orderPosition.calculation,
    currencyCode: order.currencyCode,
    quantity: orderPosition.quantity,
  });
};

export const OrderItem = {
  async discounts(
    orderPosition: OrderPosition,
    _,
    context: Context,
  ): Promise<Array<OrderPositionDiscount>> {
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
    _,
    { modules, loaders }: Context,
  ): Promise<
    Array<{
      _id: string;
      deliveryProvider: DeliveryProvider;
      warehousingProvider: WarehousingProvider;
      shipping: Date;
      earliestDelivery: Date;
    }>
  > {
    const scheduling = orderPosition.scheduling || [];
    // TODO: use order loader
    const order = await modules.orders.findOrder({ orderId: orderPosition.orderId });
    const { countryCode, userId } = order;

    // TODO: use order delivery loader
    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });

    const deliveryProvider = await loaders.deliveryProviderLoader.load({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    });
    const product = await loaders.productLoader.load({
      productId: orderPosition.productId,
    });

    return Promise.all(
      scheduling.map(async (schedule) => {
        // TODO: use warehousing provider loader
        const warehousingProvider = await modules.warehousing.findProvider({
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

  async order(orderPosition: OrderPosition, _, { modules }: Context): Promise<Order> {
    // TODO: use order loader
    return modules.orders.findOrder({ orderId: orderPosition.orderId });
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

  async quotation(orderPosition: OrderPosition, _, { modules }: Context): Promise<Quotation> {
    if (!orderPosition.quotationId) return null;
    // TODO: use quotation loader
    return modules.quotations.findQuotation({ quotationId: orderPosition.quotationId });
  },

  async total(
    orderPosition: OrderPosition,
    params: { category: string; useNetPrice: boolean },
    context: Context,
  ): Promise<Price> {
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
  ): Promise<Price> {
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
  ): Promise<Array<TokenSurrogate>> {
    return modules.warehousing.findTokens({
      orderPositionId: orderPosition._id,
    });
  },
};
