import {
  BasePricingDirector,
  IPricingDirector,
  IPaymentPricingAdapter,
  IPaymentPricingSheet,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
} from '../directors/index.js';
import { PaymentPricingSheet } from './PaymentPricingSheet.js';
import { PaymentProvider } from '@unchainedshop/core-payment';
import { OrderPayment, Order } from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';

export type PaymentPricingContext =
  | {
      country?: string;
      currency?: string;
      user: User;
      order: Order;
      provider: PaymentProvider;
      providerContext?: any;
    }
  | {
      currency: string;
      item: OrderPayment;
    };

export type IPaymentPricingDirector<DiscountConfiguration = unknown> = IPricingDirector<
  PaymentPricingContext,
  PaymentPricingCalculation,
  PaymentPricingAdapterContext,
  IPaymentPricingSheet,
  IPaymentPricingAdapter<DiscountConfiguration>
>;

const baseDirector = BasePricingDirector<
  PaymentPricingContext,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  IPaymentPricingAdapter
>('PaymentPricingDirector');

export const PaymentPricingDirector: IPaymentPricingDirector<any> = {
  ...baseDirector,

  async buildPricingContext(context, unchainedAPI) {
    const { modules } = unchainedAPI;

    if ('item' in context) {
      const { item, currency } = context;
      const order = await modules.orders.findOrder({
        orderId: item.orderId,
      });
      const provider = await modules.payment.paymentProviders.findProvider({
        paymentProviderId: item.paymentProviderId,
      });
      const user = await modules.users.findUserById(order.userId);
      const discounts = await modules.orders.discounts.findOrderDiscounts({
        orderId: item.orderId,
      });

      return {
        ...unchainedAPI,
        country: order.countryCode,
        currency,
        order,
        provider,
        user,
        discounts,
        orderPayment: item,
        providerContext: null,
      };
    }

    return {
      ...unchainedAPI,
      country: context.country,
      currency: context.currency,
      order: context.order,
      provider: context.provider,
      user: context.user,
      discounts: [],
      orderPayment: null,
      providerContext: context.providerContext,
    };
  },

  calculationSheet(pricingContext, calculation) {
    return PaymentPricingSheet({
      calculation,
      currency: pricingContext.currency,
    });
  },
};
