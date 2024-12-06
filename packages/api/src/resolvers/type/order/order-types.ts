import crypto from 'crypto';
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
  OrderPricingSheet,
} from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';
import { Price } from '@unchainedshop/utils';

export const Order = {
  async supportedDeliveryProviders(
    order: OrderType,
    _,
    context: Context,
  ): Promise<Array<DeliveryProvider>> {
    return context.services.orders.supportedDeliveryProviders(
      {
        order,
      },
      context,
    );
  },

  async supportedPaymentProviders(order: OrderType, _, context: Context) {
    return context.services.orders.supportedPaymentProviders(
      {
        order,
      },
      context,
    );
  },

  async currency(order: OrderType, _, { modules }: Context): Promise<Currency> {
    return modules.currencies.findCurrency({ isoCode: order.currency });
  },

  async country(order: OrderType, _, { modules }: Context): Promise<Country> {
    return modules.countries.findCountry({ isoCode: order.countryCode });
  },

  async discounts(order: OrderType, _, { modules }: Context): Promise<Array<OrderDiscount>> {
    return modules.orders.discounts.findOrderDiscounts({ orderId: order._id });
  },

  async delivery(order: OrderType, _, { modules }: Context): Promise<OrderDelivery> {
    return modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });
  },

  async enrollment(order: OrderType, _, { modules }: Context): Promise<Enrollment> {
    return modules.enrollments.findEnrollment({
      orderId: order._id,
    });
  },

  async items(order: OrderType, _, { modules }: Context): Promise<Array<OrderPosition>> {
    return modules.orders.positions.findOrderPositions({
      orderId: order._id,
    });
  },

  async payment(order: OrderType, _, { modules }: Context): Promise<OrderPayment> {
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

  async total(order: OrderType, params: { category: string; useNetPrice: boolean }): Promise<Price> {
    const pricing = OrderPricingSheet({
      calculation: order.calculation,
      currency: order.currency,
    });

    if (pricing.isValid()) {
      const price = pricing.total(params);
      return {
        _id: crypto
          .createHash('sha256')
          .update([order._id, JSON.stringify(params), JSON.stringify(price)].join(''))
          .digest('hex'),
        ...price,
      };
    }
    return null;
  },

  async user(order: OrderType, _, { modules }: Context): Promise<User> {
    return modules.users.findUserById(order.userId);
  },
};
