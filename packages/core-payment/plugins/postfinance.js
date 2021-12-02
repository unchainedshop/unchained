import {
  registerAdapter,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';

const { POSTFINANCE_SECRET } = process.env;

class Postfinance extends PaymentAdapter {
  static key = 'ch.postfinance';

  static label = 'Postfinance';

  static version = '1.0';

  static initialConfiguration = [];

  static typeSupported(type) {
    return type === 'GENERIC';
  }
  isActive() { // eslint-disable-line
    return false;
  }
  isPayLaterAllowed() { // eslint-disable-line
    return false;
  }

  configurationError() { // eslint-disable-line
    if (!POSTFINANCE_SECRET) {
      return PaymentError.WRONG_CREDENTIALS;
    }
    return null;
  }
}

registerAdapter(Postfinance);
