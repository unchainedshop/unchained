import crypto from 'crypto';
import { Context } from '@unchainedshop/types/api.js';
import { DeliveryProvider } from '@unchainedshop/types/delivery.js';
import { Order } from '@unchainedshop/types/orders.js';
import { OrderPosition, OrderPositionDiscount } from '@unchainedshop/types/orders.positions.js';
import { OrderPrice } from '@unchainedshop/types/orders.pricing.js';
import { Product } from '@unchainedshop/types/products.js';
import { Quotation } from '@unchainedshop/types/quotations.js';
import { WarehousingProvider } from '@unchainedshop/types/warehousing.js';

type HelperType<P, T> = (orderPosition: OrderPosition, params: P, context: Context) => T;

export interface OrderItemHelperTypes {
  discounts: HelperType<never, Promise<Array<OrderPositionDiscount>>>;
  dispatches: HelperType<
    never,
    Promise<
      Array<{
        _id: string;
        deliveryProvider: DeliveryProvider;
        warehousingProvider: WarehousingProvider;
        shipping: Date;
        earliestDelivery: Date;
      }>
    >
  >;
  order: HelperType<never, Promise<Order>>;
  originalProduct: HelperType<never, Promise<Product>>;
  product: HelperType<never, Promise<Product>>;
  quotation: HelperType<never, Promise<Quotation>>;
  total: HelperType<{ category: string }, Promise<OrderPrice>>;
  unitPrice: HelperType<{ useNetPrice: boolean }, Promise<OrderPrice>>;
}

const getPricingSheet = async (orderPosition: OrderPosition, context: Context) => {
  const { modules } = context;

  const order = await modules.orders.findOrder({
    orderId: orderPosition.orderId,
  });
  const pricingSheet = modules.orders.positions.pricingSheet(orderPosition, order.currency, context);

  return pricingSheet;
};

export const OrderItem: OrderItemHelperTypes = {
  discounts: async (obj, _, context) => {
    const pricingSheet = await getPricingSheet(obj, context);

    if (pricingSheet.isValid()) {
      // IMPORTANT: Do not send any parameter to obj.discounts!
      return pricingSheet.discountPrices().map((discount) => ({
        item: obj,
        ...discount,
      }));
    }
    return [];
  },

  dispatches: async (obj, _, { modules, loaders }) => {
    const scheduling = obj.scheduling || [];
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const { countryCode, userId } = order;

    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });
    const deliveryProvider = await modules.delivery.findProvider({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    });
    const product = await loaders.productLoader.load({
      productId: obj.productId,
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
          quantity: obj.quantity,
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

  order: async (obj, _, { modules }) => {
    return modules.orders.findOrder({ orderId: obj.orderId });
  },

  originalProduct: async (obj, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: obj.originalProductId,
    });
    return product;
  },

  product: async (obj, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: obj.productId,
    });
    return product;
  },

  quotation: async (obj, _, { modules }) => {
    if (!obj.quotationId) return null;
    return modules.quotations.findQuotation({ quotationId: obj.quotationId });
  },

  total: async (obj, { category }, context) => {
    const pricingSheet = await getPricingSheet(obj, context);

    if (pricingSheet.isValid()) {
      const { amount, currency } = pricingSheet.total({
        category,
        useNetPrice: false,
      });
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${obj._id}-${category}`, amount, currency].join(''))
          .digest('hex'),
        amount,
        currency,
      };
    }
    return null;
  },

  unitPrice: async (obj, params, context) => {
    const pricingSheet = await getPricingSheet(obj, context);

    if (pricingSheet.isValid()) {
      const price = pricingSheet.unitPrice(params);
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${obj._id}-unit`, price.amount, pricingSheet.currency].join(''))
          .digest('hex'),
        currency: pricingSheet.currency,
        ...price,
      };
    }
    return null;
  },
};
