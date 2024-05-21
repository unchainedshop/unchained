import crypto from 'crypto';
import { Context } from '@unchainedshop/types/api.js';
import { Country } from '@unchainedshop/types/countries.js';
import { Currency } from '@unchainedshop/types/currencies.js';
import { DeliveryProvider } from '@unchainedshop/types/delivery.js';
import { Enrollment } from '@unchainedshop/types/enrollments.js';
import { Order as OrderType } from '@unchainedshop/types/orders.js';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries.js';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts.js';
import { OrderPayment } from '@unchainedshop/types/orders.payments.js';
import { OrderPosition } from '@unchainedshop/types/orders.positions.js';
import { OrderPrice } from '@unchainedshop/types/orders.pricing.js';
import { User } from '@unchainedshop/types/user.js';

export const Order = {
  async supportedDeliveryProviders(
    order: OrderType,
    _,
    context: Context,
  ): Promise<Array<DeliveryProvider>> {
    return context.modules.delivery.findSupported(
      {
        order,
      },
      context,
    );
  },

  async supportedPaymentProviders(order: OrderType, _, context: Context) {
    return context.modules.payment.paymentProviders.findSupported(
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

  async total(
    order: OrderType,
    params: { category: string; useNetPrice: boolean },
    { modules }: Context,
  ): Promise<OrderPrice> {
    const pricingSheet = modules.orders.pricingSheet(order);

    if (pricingSheet.isValid()) {
      const price = pricingSheet.total(params);
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
