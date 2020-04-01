import {
  PaymentDirector,
  PaymentAdapter,
  PaymentProviderType,
} from 'meteor/unchained:core-payment';

class Invoice extends PaymentAdapter {
  static key = 'shop.unchained.invoice-prepaid';

  static label = 'Invoice Prepaid (manually)';

  static version = '1.0';

  static initialConfiguration = [];

  static typeSupported(type) {
    return type === PaymentProviderType.INVOICE;
  }

  configurationError() { // eslint-disable-line
    return null;
  }

  isActive() { // eslint-disable-line
    return true;
  }

  isPayLaterAllowed() { // eslint-disable-line
    return false;
  }

  async charge(transactionContext) {  // eslint-disable-line
    return false;
  }
}

PaymentDirector.registerAdapter(Invoice);
