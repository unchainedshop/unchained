import { Context } from '@unchainedshop/types/api';
import { OrderPayment as OrderPaymentType } from '@unchainedshop/types/orders.payments';
import { PaymentProviderType } from 'meteor/unchained:core-payment';
import { objectInvert } from 'meteor/unchained:utils';

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
