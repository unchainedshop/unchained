import { PaymentPricingSheet } from '@unchainedshop/core';
import type { Context } from '../../../context.ts';
import type { OrderPayment as OrderPaymentType } from '@unchainedshop/core-orders';
import { PaymentProviderType } from '@unchainedshop/core-payment';

export const OrderPayment = {
  __resolveType: async (obj: OrderPaymentType, { loaders }: Context) => {
    const provider = await loaders.paymentProviderLoader.load({
      paymentProviderId: obj.paymentProviderId,
    });

    switch (provider?.type) {
      case PaymentProviderType.INVOICE:
        return 'OrderPaymentInvoice';
      default:
        return 'OrderPaymentGeneric';
    }
  },
};

// The gross amount the order charges for the payment (fees, discounts and taxes), the
// same amount the order-level PAYMENT row carries. null while the payment is not priced.
export const orderPaymentFee = async (obj: OrderPaymentType, _: never, { loaders }: Context) => {
  const order = await loaders.orderLoader.load({ orderId: obj.orderId });
  const pricing = PaymentPricingSheet({
    calculation: obj.calculation,
    currencyCode: order.currencyCode,
  });
  if (!pricing.isValid()) return null;
  return { ...pricing.total(), isTaxable: pricing.taxSum() !== 0, isNetPrice: false };
};
