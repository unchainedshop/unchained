import {
  PaymentDirector,
  PaymentAdapter,
  PaymentProviderType,
} from 'meteor/unchained:core-payment';

class Invoice extends PaymentAdapter {
  static key = 'shop.unchained.invoice';

  static label = 'Invoice (manually)';

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
    return true;
  }
}

PaymentDirector.registerAdapter(Invoice);
