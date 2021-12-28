import { OrderPayment } from '@unchainedshop/types/orders';
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

  buildPricingContext: ({ item }: { item: OrderPayment }, requestContext) => {
    // TODO: use modules
    /* @ts-ignore */
    const order = item.order();
    // TODO: use modules
    /* @ts-ignore */
    const provider = item.provider();
    const user = order.user();

    return {
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
