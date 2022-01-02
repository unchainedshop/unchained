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

  buildPricingContext: async (
    { item }: { item: OrderPayment },
    requestContext
  ) => {
    const order = await requestContext.modules.orders.findOrder({
      orderId: item.orderId,
    });
    const provider =
      await requestContext.modules.payment.paymentProviders.findProvider({
        paymentProviderId: item.paymentProviderId,
      });
    const user = await requestContext.modules.users.findUser({
      userId: order.userId,
    });

    return {
      orderPayment: item,
      order,
      provider,
      user,
      ...item.context,
      ...requestContext,
    };
  },

  resultSheet: () => {
    return PaymentPricingSheet({
      calculation: baseDirector.getCalculation(),
      currency: baseDirector.getContext().order.currency,
    });
  },
};
