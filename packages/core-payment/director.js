import { log } from 'meteor/unchained:core-logger';

const PaymentError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS'
};

class PaymentAdapter {
  static key = '';

  static label = '';

  static version = '';

  static typeSupported() {
    return false;
  }

  constructor(config, context) {
    this.config = config;
    this.context = context;
  }

  configurationError() { // eslint-disable-line
    return PaymentError.NOT_IMPLEMENTED;
  }

  isActive() { // eslint-disable-line
    return false;
  }

  isPayLaterAllowed() { // eslint-disable-line
    return false;
  }

  async charge(transactionContext) {  // eslint-disable-line
    // if you return true, the status will be changed to PAID

    // if you return false, the order payment status stays the
    // same but the order status might change

    // if you throw an error, you cancel the checkout process
    return false;
  }

  log(message, { level = 'debug', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class PaymentDirector {
  constructor(provider) {
    this.provider = provider;
  }

  interfaceClass() {
    return PaymentDirector.adapters.get(this.provider.adapterKey);
  }

  interface(context) {
    const Adapter = this.interfaceClass();
    return new Adapter(this.provider.configuration, context);
  }

  configurationError(context) {
    try {
      const adapter = this.interface(context);
      const error = adapter.configurationError();
      return error;
    } catch (error) {
      return PaymentError.ADAPTER_NOT_FOUND;
    }
  }

  isActive(context) { // eslint-disable-line
    try {
      const adapter = this.interface(context);
      return adapter.isActive();
    } catch (error) {
      log(error.message, { level: 'error' });
      return false;
    }
  }

  isPayLaterAllowed(context) { // eslint-disable-line
    try {
      const adapter = this.interface(context);
      return adapter.isPayLaterAllowed();
    } catch (error) {
      log(error.message, { level: 'error' });
      return false;
    }
  }

  async charge({ transactionContext, ...context }) {
    const adapter = this.interface(context);
    const chargeResult = await adapter.charge(transactionContext);
    return chargeResult;
  }

  async run(command, context, ...args) {
    const adapter = this.interface(context);
    return adapter[command](...args);
  }

  static adapters = new Map();

  static filteredAdapters(filter) {
    return Array.from(PaymentDirector.adapters)
      .map(entry => entry[1])
      .filter(filter || (() => true))
      .sort(entry => entry.key);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    PaymentDirector.adapters.set(adapter.key, adapter);
  }
}

export { PaymentDirector, PaymentAdapter, PaymentError };
