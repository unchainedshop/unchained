import crypto from 'crypto';
import { Context } from '@unchainedshop/api';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Order } from '@unchainedshop/types/orders.js';
import { OrderPosition, OrderPositionDiscount } from '@unchainedshop/types/orders.positions.js';
import { OrderPrice } from '@unchainedshop/types/orders.pricing.js';
import { Product } from '@unchainedshop/types/products.js';
import { Quotation } from '@unchainedshop/types/quotations.js';
import { TokenSurrogate, WarehousingProvider } from '@unchainedshop/core-warehousing';

const getPricingSheet = async (orderPosition: OrderPosition, context: Context) => {
  const { modules } = context;

  const order = await modules.orders.findOrder({
    orderId: orderPosition.orderId,
  });
  const pricingSheet = modules.orders.positions.pricingSheet(orderPosition, order.currency, context);

  return pricingSheet;
};

export const OrderItem = {
  async discounts(
    orderPosition: OrderPosition,
    _,
    context: Context,
  ): Promise<Array<OrderPositionDiscount>> {
    const pricingSheet = await getPricingSheet(orderPosition, context);

    if (pricingSheet.isValid()) {
      // IMPORTANT: Do not send any parameter to obj.discounts!
      return pricingSheet.discountPrices().map((discount) => ({
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
  ): Promise<OrderPrice> {
    const pricingSheet = await getPricingSheet(orderPosition, context);

    if (pricingSheet.isValid()) {
      const price = pricingSheet.total(params);
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
  ): Promise<OrderPrice> {
    const pricingSheet = await getPricingSheet(orderPosition, context);

    if (pricingSheet.isValid()) {
      const price = pricingSheet.unitPrice(params);
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
