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

  async discounts(order: OrderType, _, { modules }: Context): Promise<OrderDiscount[]> {
    return modules.orders.discounts.findOrderDiscounts({ orderId: order._id });
  },

  async delivery(order: OrderType, _, { modules }: Context): Promise<OrderDelivery | null> {
    const orderDelivery =
      order.deliveryId &&
      (await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      }));

    if (!orderDelivery) return null;
    return orderDelivery;
  },

  async enrollment(order: OrderType, _, { modules }: Context): Promise<Enrollment | null> {
    const enrollment = await modules.enrollments.findEnrollment({
      orderId: order._id,
    });
    if (!enrollment) return null;
    return enrollment;
  },

  async items(order: OrderType, _, { modules }: Context): Promise<OrderPosition[]> {
    return modules.orders.positions.findOrderPositions({
      orderId: order._id,
    });
  },

  async payment(order: OrderType, _, { modules }: Context): Promise<OrderPayment | null> {
    const payment =
      order.paymentId &&
      (await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      }));
    if (!payment) return null;
    return payment;
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
