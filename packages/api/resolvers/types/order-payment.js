import { PaymentProviderType } from 'meteor/unchained:core-payment';
import { objectInvert } from 'meteor/unchained:utils';

const OrderPaymentMap = {
  OrderPaymentGeneric: PaymentProviderType.GENERIC,
  OrderPaymentCard: PaymentProviderType.CARD,
  OrderPaymentInvoice: PaymentProviderType.INVOICE,
};

export default {
  __resolveType(obj) {
    const provider = obj.provider();
    const invertedProductTypes = objectInvert(OrderPaymentMap);
    if (provider) {
      return invertedProductTypes[provider.type];
    }
    return invertedProductTypes[PaymentProviderType.INVOICE];
  },
};
