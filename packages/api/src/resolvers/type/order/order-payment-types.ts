import { Context } from '@unchainedshop/types/api.js';
import { OrderPayment as OrderPaymentType } from '@unchainedshop/types/orders.payments.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { objectInvert } from '@unchainedshop/utils';

const OrderPaymentMap = {
  OrderPaymentGeneric: PaymentProviderType.GENERIC,
  OrderPaymentCard: PaymentProviderType.CARD,
  OrderPaymentInvoice: PaymentProviderType.INVOICE,
};

export const OrderPayment = {
  __resolveType: async (obj: OrderPaymentType, { modules }: Context) => {
    const provider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId: obj.paymentProviderId,
    });

    const invertedProductTypes = objectInvert(OrderPaymentMap);
    if (provider) {
      return invertedProductTypes[provider.type];
    }
    return invertedProductTypes[PaymentProviderType.INVOICE];
  },
};
