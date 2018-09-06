import { log } from 'meteor/unchained:core-logger';

export const DeliveryError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
};

export class DeliveryAdapter {
  static key = ''

  static label = ''

  static version = ''

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

  async estimatedDeliveryThroughput() { // eslint-disable-line
    return 0;
  }

  send() {  // eslint-disable-line
    // if you return true, the status will be changed to DELIVERED

    // if you return false, the order delivery status stays the
    // same but the order status might change

    // if you throw an error, you cancel the whole checkout process
    return false;
  }

  log(message) { // eslint-disable-line
    return log(message);
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
      throw new Error(`Delivery Plugin ${this.provider.adapterKey} not available`);
    }
    return new Adapter(this.provider.configuration, context);
  }

  send(context) {
    const adapter = this.interface(context);
    const result = adapter.send();
    return result;
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

  async estimatedDeliveryThroughput(context) {
    try {
      const adapter = this.interface(context);
      return adapter.estimatedDeliveryThroughput();
    } catch (error) {
      console.warn(error); // eslint-disable-line
      return null;
    }
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

  static adapters = new Map();

  static filteredAdapters(filter) {
    return Array.from(DeliveryDirector.adapters)
      .map(entry => entry[1])
      .filter(filter || (() => true))
      .sort(entry => entry.key);
  }

  static registerAdapter(AdapterClass) {
    log(`${this.name} -> Registered ${AdapterClass.key} ${AdapterClass.version} (${AdapterClass.label})`) // eslint-disable-line
    DeliveryDirector.adapters.set(AdapterClass.key, AdapterClass);
  }
}
