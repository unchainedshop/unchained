import crypto from 'crypto';
import { Context } from '../../../context.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Order } from '@unchainedshop/core-orders';
import { OrderPosition, OrderPositionDiscount } from '@unchainedshop/core-orders';
import { Product, ProductPricingSheet } from '@unchainedshop/core-products';
import { Quotation } from '@unchainedshop/core-quotations';
import { TokenSurrogate, WarehousingProvider } from '@unchainedshop/core-warehousing';
import { Price } from '@unchainedshop/utils';

const getPricingSheet = async (orderPosition: OrderPosition, context: Context) => {
  const { modules } = context;

  const order = await modules.orders.findOrder({
    orderId: orderPosition.orderId,
  });
  return ProductPricingSheet({
    calculation: orderPosition.calculation,
    currency: order.currency,
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
    const order = await modules.orders.findOrder({ orderId: orderPosition.orderId });
    const { countryCode, userId } = order;

    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });
    const deliveryProvider = await modules.delivery.findProvider({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    });
    const product = await loaders.productLoader.load({
      productId: orderPosition.productId,
    });

    return Promise.all(
      scheduling.map(async (schedule) => {
        const warehousingProvider = await modules.warehousing.findProvider({
          warehousingProviderId: schedule.warehousingProviderId,
        });

        const context = {
          warehousingProvider,
          deliveryProvider,
          product,
          quantity: orderPosition.quantity,
          country: countryCode,
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
    return modules.quotations.findQuotation({ quotationId: orderPosition.quotationId });
  },

  async total(
    orderPosition: OrderPosition,
    params: { category: string; useNetPrice: boolean },
    context: Context,
  ): Promise<Price> {
    const pricing = await getPricingSheet(orderPosition, context);

    if (pricing.isValid()) {
      const price = pricing.total(params);
      return {
        _id: crypto
          .createHash('sha256')
          .update([orderPosition._id, JSON.stringify(params), JSON.stringify(price)].join(''))
          .digest('hex'),
        ...price,
      };
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
      const price = pricing.unitPrice(params);
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${orderPosition._id}-unit`, price.amount, pricingSheet.currency].join(''))
          .digest('hex'),
        ...price,
      };
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
