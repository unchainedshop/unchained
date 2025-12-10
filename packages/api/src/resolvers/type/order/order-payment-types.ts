import { Context } from '../../../context.js';
import { OrderPayment as OrderPaymentType } from '@unchainedshop/core-orders';
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
