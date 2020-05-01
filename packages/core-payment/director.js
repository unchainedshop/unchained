import { log } from 'meteor/unchained:core-logger';

const PaymentError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
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

  // eslint-disable-next-line
  configurationError() {
    return PaymentError.NOT_IMPLEMENTED;
  }

  // eslint-disable-next-line
  isActive() {
    return false;
  }

  // eslint-disable-next-line
  isPayLaterAllowed() {
    return false;
  }

  // eslint-disable-next-line
  async charge(transactionContext) {
    // if you return true, the status will be changed to PAID

    // if you return false, the order payment status stays the
    // same but the order status might change

    // if you throw an error, you cancel the checkout process
    return false;
  }

  // eslint-disable-next-line
  async register(transactionContext) {
    return {
      token: '',
    };
  }

  // eslint-disable-next-line
  async sign(transactionContext) {
    return null;
  }

  // eslint-disable-next-line
  async validate(token) {
    return true;
  }

  // eslint-disable-next-line
  log(message, { level = 'debug', ...options } = {}) {
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

  isActive(context) {
    try {
      const adapter = this.interface(context);
      return adapter.isActive();
    } catch (error) {
      log(error.message, { level: 'error' });
      return false;
    }
  }

  isPayLaterAllowed(context) {
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
    return adapter.charge(transactionContext);
  }

  async register({ transactionContext, ...context }) {
    const adapter = this.interface(context);
    return adapter.register(transactionContext);
  }

  async sign({ transactionContext, ...context }) {
    const adapter = this.interface(context);
    return adapter.sign(transactionContext);
  }

  async validate({ token, ...context }) {
    const adapter = this.interface(context);
    const validated = await adapter.validate(token);
    return !!validated;
  }

  async run(command, context, ...args) {
    const adapter = this.interface(context);
    return adapter[command](...args);
  }

  static adapters = new Map();

  static filteredAdapters(filter) {
    return Array.from(PaymentDirector.adapters)
      .map((entry) => entry[1])
      .filter(filter || (() => true));
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    PaymentDirector.adapters.set(adapter.key, adapter);
  }
}

export { PaymentDirector, PaymentAdapter, PaymentError };
