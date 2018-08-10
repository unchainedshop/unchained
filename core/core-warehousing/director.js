import { log } from 'meteor/unchained:core-logger';

const WarehousingError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
};

class WarehousingAdapter {
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
    return WarehousingError.NOT_IMPLEMENTED;
  }

  isActive() { // eslint-disable-line
    return false;
  }

  async stock(referenceDate) { // eslint-disable-line
    return 0;
  }

  async productionTime(quantityToProduce) { // eslint-disable-line
    return 0;
  }

  async commissioningTime(quantity) { // eslint-disable-line
    return 0;
  }

  log(message) { // eslint-disable-line
    return log(message);
  }
}

class WarehousingDirector {
  constructor(provider) {
    this.provider = provider;
  }

  interfaceClass() {
    return WarehousingDirector.adapters.get(this.provider.adapterKey);
  }

  interface(context) {
    const Adapter = this.interfaceClass();
    if (!Adapter) {
      throw new Error(`Warehousing Plugin ${this.provider.adapterKey} not available`);
    }
    return new Adapter(this.provider.configuration, context);
  }

  async throughputTime(context) {
    try {
      const { quantity } = context;
      const referenceDate = WarehousingDirector.getReferenceDate(context);
      const adapter = this.interface(context);
      const stock = await adapter.stock(referenceDate) || 0;
      const notInStockQuantity = Math.max(quantity - stock, 0);
      const productionTime = await adapter.productionTime(notInStockQuantity);
      const commissioningTime = await adapter.commissioningTime(quantity);
      return Math.max(commissioningTime + productionTime, 0);
    } catch (error) {
      console.error(error); // eslint-disable-line
      return 0;
    }
  }

  async estimatedStock(context) {
    try {
      const referenceDate = WarehousingDirector.getReferenceDate(context);
      const adapter = this.interface(context);
      const stock = await adapter.stock(referenceDate);
      return stock;
    } catch (error) {
      console.error(error); // eslint-disable-line
      return null;
    }
  }

  async estimatedDispatch(context) {
    try {
      const { deliveryProvider } = context;
      const referenceDate = WarehousingDirector.getReferenceDate(context);
      const warehousingThroughputTime = await this.throughputTime(context);
      const deliveryThroughputTime = deliveryProvider
        .estimatedDeliveryThroughput(context, warehousingThroughputTime);
      const shippingTimestamp = referenceDate.getTime() + warehousingThroughputTime;
      const earliestDeliveryTimestamp = shippingTimestamp + deliveryThroughputTime;
      return {
        shipping: new Date(shippingTimestamp),
        earliestDelivery: new Date(earliestDeliveryTimestamp),
      };
    } catch (error) {
      console.error(error); // eslint-disable-line
      return { };
    }
  }

  configurationError() {
    try {
      const adapter = this.interface();
      const error = adapter.configurationError();
      return error;
    } catch (error) {
      console.warn(error); // eslint-disable-line
      return WarehousingError.ADAPTER_NOT_FOUND;
    }
  }

  isActive(context) {
    try {
      const adapter = this.interface();
      return adapter.isActive(context);
    } catch (error) {
      console.warn(error); // eslint-disable-line
      return false;
    }
  }

  static adapters = new Map();

  static filteredAdapters(filter) {
    return Array.from(WarehousingDirector.adapters)
      .map(entry => entry[1])
      .filter(filter || (() => true));
  }

  static getReferenceDate(context) {
    return (context && context.referenceDate)
      ? context.referenceDate
      : new Date();
  }

  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`) // eslint-disable-line
    WarehousingDirector.adapters.set(adapter.key, adapter);
  }
}

export {
  WarehousingDirector,
  WarehousingAdapter,
  WarehousingError,
};
