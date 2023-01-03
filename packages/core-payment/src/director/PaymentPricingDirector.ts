import {
  IPaymentPricingAdapter,
  IPaymentPricingDirector,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  PaymentPricingContext,
} from '@unchainedshop/types/payments.pricing.js';
import { BasePricingDirector } from '@unchainedshop/utils';
import { PaymentPricingSheet } from './PaymentPricingSheet.js';

const baseDirector = BasePricingDirector<
  PaymentPricingContext,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  IPaymentPricingAdapter
>('PaymentPricingDirector');

export const PaymentPricingDirector: IPaymentPricingDirector = {
  ...baseDirector,

  async buildPricingContext({ item, ...context }, unchainedAPI) {
    if (!item)
      return {
        discounts: [],
        ...context,
        ...unchainedAPI,
      };

    const order = await unchainedAPI.modules.orders.findOrder({
      orderId: item.orderId,
    });
    const provider = await unchainedAPI.modules.payment.paymentProviders.findProvider({
      paymentProviderId: item.paymentProviderId,
    });
    const user = await unchainedAPI.modules.users.findUserById(order.userId);
    const discounts = await unchainedAPI.modules.orders.discounts.findOrderDiscounts({
      orderId: item.orderId,
    });

    return {
      country: order.countryCode,
      currency: order.currency,
      ...context,
      ...unchainedAPI,
      order,
      orderPayment: item,
      provider,
      user,
      discounts,
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
