import { Context } from '../../../context.js';
import { OrderPayment as OrderPaymentType } from '@unchainedshop/core-orders';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { objectInvert } from '@unchainedshop/utils';

const OrderPaymentMap = {
  OrderPaymentGeneric: PaymentProviderType.GENERIC,
  OrderPaymentInvoice: PaymentProviderType.INVOICE,
};

export const OrderPayment = {
  __resolveType: async (obj: OrderPaymentType, { loaders }: Context) => {
    const provider = await loaders.paymentProviderLoader.load({
      paymentProviderId: obj.paymentProviderId,
    });

    const invertedProductTypes = objectInvert(OrderPaymentMap);
    if (provider) {
      return invertedProductTypes[provider.type];
    }
    return invertedProductTypes[PaymentProviderType.INVOICE];
  },
};
