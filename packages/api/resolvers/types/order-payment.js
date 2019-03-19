import { PaymentProviderType } from 'meteor/unchained:core-payment';
import { objectInvert } from 'meteor/unchained:utils';

const OrderPaymentMap = {
  OrderPaymentPostfinance: PaymentProviderType.POSTFINANCE,
  OrderPaymentPaypal: PaymentProviderType.PAYPAL,
  OrderPaymentCrypto: PaymentProviderType.CRYPTO,
  OrderPaymentCard: PaymentProviderType.CARD,
  OrderPaymentInvoice: PaymentProviderType.INVOICE
};

export default {
  __resolveType(obj) {
    const provider = obj.provider();
    const invertedProductTypes = objectInvert(OrderPaymentMap);
    if (provider) {
      return invertedProductTypes[provider.type];
    }
    return invertedProductTypes[PaymentProviderType.INVOICE];
  }
};
