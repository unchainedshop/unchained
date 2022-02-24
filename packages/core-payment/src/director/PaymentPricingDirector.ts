import { OrderPayment } from '@unchainedshop/types/orders.payments';
import {
  IPaymentPricingAdapter,
  IPaymentPricingDirector,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  PaymentPricingContext,
} from '@unchainedshop/types/payments.pricing';
import { BasePricingDirector } from 'meteor/unchained:utils';
import { PaymentPricingSheet } from './PaymentPricingSheet';

const baseDirector = BasePricingDirector<
  PaymentPricingContext,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  IPaymentPricingAdapter
>('PaymentPricingDirector');

export const PaymentPricingDirector: IPaymentPricingDirector = {
  ...baseDirector,

  async buildPricingContext({ item, ...rest }: { item: OrderPayment }, requestContext) {
    const { providerContext, currency, ...context } = rest as any;

    if (!item)
      return {
        discounts: [],
        providerContext,
        currency,
        ...context,
        ...requestContext,
      };

    const order = await requestContext.modules.orders.findOrder({
      orderId: item.orderId,
    });
    const provider = await requestContext.modules.payment.paymentProviders.findProvider({
      paymentProviderId: item.paymentProviderId,
    });
    const user = await requestContext.modules.users.findUser({
      userId: order.userId,
    });
    const discounts = await requestContext.modules.orders.discounts.findOrderDiscounts({
      orderId: item.orderId,
    });

    return {
      country: order.countryCode,
      currency: currency || order.currency,
      order,
      provider,
      user,
      discounts,
      ...item.context,
      ...context,
      ...requestContext,
    };
  },

  async actions(pricingContext, requestContext) {
    if (!requestContext.modules) {
      throw new Error('HERE');
    }
    const actions = await baseDirector.actions(pricingContext, requestContext, this.buildPricingContext);
    return {
      ...actions,
      resultSheet() {
        const calculation = actions.getCalculation();
        const context = actions.getContext();

        return PaymentPricingSheet({
          calculation,
          currency: context.currency,
        });
      },
    };
  },
};
