import {
  IPaymentPricingAdapter,
  IPaymentPricingSheet,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
} from './PaymentPricingAdapter.js';
import { BasePricingDirector } from '@unchainedshop/utils';
import { PaymentPricingSheet } from './PaymentPricingSheet.js';
import { User } from '@unchainedshop/core-users';
import { Order } from '@unchainedshop/core-orders';
import { PaymentProvider } from '../types.js';
import { OrderPayment } from '@unchainedshop/core-orders';
import { IPricingDirector } from '@unchainedshop/utils';

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

export const PaymentPricingDirector: IPaymentPricingDirector = {
  ...baseDirector,

  async buildPricingContext(context, unchainedAPI) {
    const { modules } = unchainedAPI;

    if ('item' in context) {
      const { item } = context;
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
        currency: order.currency,
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

  async actions(pricingContext, unchainedAPI) {
    const actions = await baseDirector.actions(pricingContext, unchainedAPI, this.buildPricingContext);
    return {
      ...actions,
      calculationSheet() {
        const context = actions.getContext();
        return PaymentPricingSheet({
          calculation: actions.getCalculation(),
          currency: context.currency,
        });
      },
    };
  },
};
