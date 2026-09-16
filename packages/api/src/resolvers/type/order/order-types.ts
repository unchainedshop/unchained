import type { Context } from '../../../context.ts';
import type { Country } from '@unchainedshop/core-countries';
import type { Currency } from '@unchainedshop/core-currencies';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { Enrollment } from '@unchainedshop/core-enrollments';
import type {
  Order as OrderType,
  OrderPosition,
  OrderPayment,
  OrderDiscount,
  OrderDelivery,
} from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import type { Price } from '@unchainedshop/utils';
import { OrderPricingSheet } from '@unchainedshop/core';

export const Order = {
  async supportedDeliveryProviders(order: OrderType, _, context: Context): Promise<DeliveryProvider[]> {
    return context.services.orders.supportedDeliveryProviders({
      order,
    });
  },

  async supportedPaymentProviders(order: OrderType, _, context: Context) {
    return context.services.orders.supportedPaymentProviders({
      order,
    });
  },

  async currency(order: OrderType, _, { loaders }: Context): Promise<Currency> {
    return loaders.currencyLoader.load({ isoCode: order.currencyCode });
  },

  async country(order: OrderType, _, { loaders }: Context): Promise<Country> {
    return loaders.countryLoader.load({ isoCode: order.countryCode });
  },

  async discounts(order: OrderType, _, { loaders }: Context): Promise<OrderDiscount[]> {
    return loaders.orderDiscountsLoader.load({ orderId: order._id });
  },

  async delivery(order: OrderType, _, { loaders }: Context): Promise<OrderDelivery | null> {
    if (!order.deliveryId) return null;
    return loaders.orderDeliveryLoader.load({ orderDeliveryId: order.deliveryId });
  },

  async enrollment(order: OrderType, _, { loaders }: Context): Promise<Enrollment | null> {
    return loaders.enrollmentByOrderLoader.load({ orderId: order._id });
  },

  async items(order: OrderType, _, { loaders }: Context): Promise<OrderPosition[]> {
    return loaders.orderPositionsLoader.load({ orderId: order._id });
  },

  async payment(order: OrderType, _, { loaders }: Context): Promise<OrderPayment | null> {
    if (!order.paymentId) return null;
    return loaders.orderPaymentLoader.load({ orderPaymentId: order.paymentId });
  },

  status(order: OrderType): string {
    if (order.status === null) {
      return 'OPEN';
    }
    return order.status;
  },

  total(order: OrderType, params: { category: string; useNetPrice: boolean }): Price | null {
    const pricing = OrderPricingSheet({
      calculation: order.calculation,
      currencyCode: order.currencyCode,
    });

    if (pricing.isValid()) {
      return pricing.total(params);
    }
    return null;
  },

  async user(order: OrderType, _, { loaders }: Context): Promise<User> {
    return loaders.userLoader.load({ userId: order.userId });
  },
};
