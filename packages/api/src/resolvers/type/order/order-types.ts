import { Context } from '../../../context.js';
import { Country } from '@unchainedshop/core-countries';
import { Currency } from '@unchainedshop/core-currencies';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Enrollment } from '@unchainedshop/core-enrollments';
import {
  Order as OrderType,
  OrderPosition,
  OrderPayment,
  OrderDiscount,
  OrderDelivery,
} from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';
import { Price } from '@unchainedshop/utils';
import { OrderPricingSheet } from '@unchainedshop/core';

export const Order = {
  async supportedDeliveryProviders(
    order: OrderType,
    _,
    context: Context,
  ): Promise<Array<DeliveryProvider>> {
    return context.services.orders.supportedDeliveryProviders({
      order,
    });
  },

  async supportedPaymentProviders(order: OrderType, _, context: Context) {
    return context.services.orders.supportedPaymentProviders({
      order,
    });
  },

  async currency(order: OrderType, _, { modules }: Context): Promise<Currency> {
    // TODO: use loader
    return modules.currencies.findCurrency({ isoCode: order.currency });
  },

  async country(order: OrderType, _, { modules }: Context): Promise<Country> {
    // TODO: use loader
    return modules.countries.findCountry({ isoCode: order.countryCode });
  },

  async discounts(order: OrderType, _, { modules }: Context): Promise<Array<OrderDiscount>> {
    // TODO: use loader?
    return modules.orders.discounts.findOrderDiscounts({ orderId: order._id });
  },

  async delivery(order: OrderType, _, { modules }: Context): Promise<OrderDelivery> {
    // TODO: use loader
    return modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });
  },

  async enrollment(order: OrderType, _, { modules }: Context): Promise<Enrollment> {
    // TODO: use loader
    return modules.enrollments.findEnrollment({
      orderId: order._id,
    });
  },

  async items(order: OrderType, _, { modules }: Context): Promise<Array<OrderPosition>> {
    // TODO: use loader?
    return modules.orders.positions.findOrderPositions({
      orderId: order._id,
    });
  },

  async payment(order: OrderType, _, { modules }: Context): Promise<OrderPayment> {
    // TODO: use loader
    return modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    });
  },

  status(order: OrderType): string {
    if (order.status === null) {
      return 'OPEN';
    }
    return order.status;
  },

  total(order: OrderType, params: { category: string; useNetPrice: boolean }): Price {
    const pricing = OrderPricingSheet({
      calculation: order.calculation,
      currency: order.currency,
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
