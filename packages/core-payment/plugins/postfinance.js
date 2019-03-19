import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError
} from 'meteor/unchained:core-payment';

const { POSTFINANCE_SECRET } = process.env;

class Postfinance extends PaymentAdapter {
  static key = 'ch.postfinance';

  static label = 'Postfinance';

  static version = '1.0';

  static initialConfiguration = [];

  static typeSupported(type) {
    return type === 'POSTFINANCE';
  }
  isActive() { // eslint-disable-line
    return false;
  }
  isPayLaterAllowed() { // eslint-disable-line
    return false;
  }

  configurationError() {
    if (this.wrongCredentials || !POSTFINANCE_SECRET) {
      return PaymentError.WRONG_CREDENTIALS;
    }
    return null;
  }
}

PaymentDirector.registerAdapter(Postfinance);
