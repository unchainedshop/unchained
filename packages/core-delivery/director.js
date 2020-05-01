import { log } from 'meteor/unchained:core-logger';

export const DeliveryError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
};

export class DeliveryAdapter {
  static key = '';

  static label = '';

  static version = '';

  static typeSupported(type) { // eslint-disable-line
    return false;
  }

  constructor(config, context) {
    this.config = config;
    this.context = context;
  }

  configurationError() { // eslint-disable-line
    return DeliveryError.NOT_IMPLEMENTED;
  }

  isActive() { // eslint-disable-line
    return false;
  }

  async estimatedDeliveryThroughput(warehousingThroughputTime) { // eslint-disable-line
    return 0;
  }

  async send(transactionContext) {  // eslint-disable-line
    // if you return true, the status will be changed to DELIVERED

    // if you return false, the order delivery status stays the
    // same but the order status might change

    // if you throw an error, you cancel the whole checkout process
    return false;
  }

  async pickUpLocationById(id) {  // eslint-disable-line
    return null;
  }

  async pickUpLocations() {  // eslint-disable-line
    return [];
  }

  isAutoReleaseAllowed() { // eslint-disable-line
    // if you return false here,
    // the order will need manual confirmation before
    // unchained will try to invoke send()
    return true;
  }

  log(message, { level = 'debug', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

export class DeliveryDirector {
  constructor(provider) {
    this.provider = provider;
  }

  interfaceClass() {
    return DeliveryDirector.adapters.get(this.provider.adapterKey);
  }

  interface(context) {
    const Adapter = this.interfaceClass();
    if (!Adapter) {
      throw new Error(
        `Delivery Plugin ${this.provider.adapterKey} not available`
      );
    }
    return new Adapter(this.provider.configuration, context);
  }

  configurationError() {
    try {
      const adapter = this.interface();
      const error = adapter.configurationError();
      return error;
    } catch (error) {
      console.warn(error); // eslint-disable-line
      return DeliveryError.ADAPTER_NOT_FOUND;
    }
  }

  async estimatedDeliveryThroughput({ warehousingThroughputTime, ...context }) {
    try {
      const adapter = this.interface(context);
      return adapter.estimatedDeliveryThroughput(warehousingThroughputTime);
    } catch (error) {
      console.warn(error); // eslint-disable-line
      return null;
    }
  }

  async send({ transactionContext, ...context }) {
    const adapter = this.interface(context);
    const sendResult = await adapter.send(transactionContext);
    return sendResult;
  }

  async run(command, context, ...args) {
    const adapter = this.interface(context);
    return adapter[command](...args);
  }

  isActive(context) {
    try {
      const adapter = this.interface(context);
      return adapter.isActive();
    } catch (error) {
      console.warn(error); // eslint-disable-line
      return false;
    }
  }

  isAutoReleaseAllowed(context) {
    try {
      const adapter = this.interface(context);
      return adapter.isAutoReleaseAllowed();
    } catch (error) {
      console.warn(error); // eslint-disable-line
      return false;
    }
  }

  static adapters = new Map();

  static createSortProviders = () => () => undefined;

  static setCreateSortProviders(fn) {
    if (fn) this.createSortProviders = fn;
  }

  static filteredAdapters(filter) {
    return Array.from(DeliveryDirector.adapters)
      .map((entry) => entry[1])
      .filter(filter || (() => true));
  }

  static registerAdapter(AdapterClass) {
    log(`${this.name} -> Registered ${AdapterClass.key} ${AdapterClass.version} (${AdapterClass.label})`) // eslint-disable-line
    DeliveryDirector.adapters.set(AdapterClass.key, AdapterClass);
  }
}
