import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';

class Bitcoin extends PaymentAdapter {
  static key = 'mesh.crypto.bitcoin'

  static label = 'Bitcoin'

  static version = '1.0'

  static typeSupported(type) {
    return (type === 'CRYPTO');
  }

  configurationError() {
    const wallets = this.getWallets();
    if (wallets.length === 0) {
      return PaymentError.INCOMPLETE_CONFIGURATION;
    }
    return null;
  }

  getWallets() {
    return this.config.reduce((current, item) => {
      if (item.key === 'wallets') return item.value;
      return current.split(',');
    }, []);
  }

  isActive() {
    if (this.configurationError()) return false;
    return true;
  }

  isPayLaterAllowed() { // eslint-disable-line
    return true;
  }

  async balance(publicKey) { // eslint-disable-line
    this.log(`getting the balance of ${publicKey}`);
    throw new Error('Could not retrieve a public key');
  }

  async charge() { // eslint-disable-line
    // throw new Error('Could not retrieve a public key');
    return true;
  }
}

PaymentDirector.registerAdapter(Bitcoin);
