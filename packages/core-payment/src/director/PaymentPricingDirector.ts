import {
  IPaymentPricingAdapter,
  IPaymentPricingSheet,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
} from './PaymentPricingAdapter.js';
import { BasePricingDirector, IPricingDirector } from '@unchainedshop/utils';
import { PaymentPricingSheet } from './PaymentPricingSheet.js';
import { PaymentProvider } from '../types.js';
import type { OrderPayment, Order } from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';

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

export type IPaymentPricingDirector<
  UnchainedAPI = unknown,
  DiscountConfiguration = unknown,
> = IPricingDirector<
  PaymentPricingContext,
  PaymentPricingCalculation,
  PaymentPricingAdapterContext,
  IPaymentPricingSheet,
  IPaymentPricingAdapter<UnchainedAPI, DiscountConfiguration>,
  UnchainedAPI
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
