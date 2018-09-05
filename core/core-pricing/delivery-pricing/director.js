import { Promise } from 'meteor/promise';
import { log } from 'meteor/unchained:core-logger';
import { DeliveryPricingSheet } from './sheet';

class DeliveryPricingAdapter {
  static key = ''

  static label = ''

  static version = ''

  static orderIndex = 0

  static isActivatedFor() {
    return false;
  }

  constructor({ context, calculation }) {
    this.context = context;
    const { currency } = this.context.order;
    this.calculation = new DeliveryPricingSheet({ calculation, currency });
    this.result = new DeliveryPricingSheet({ currency });
  }

  calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) => log(`Delivery Calculation -> ${category} ${amount}`));
    return resultRaw;
  }

  log(message) { // eslint-disable-line
    return log(message);
  }
}

class DeliveryPricingDirector {
  constructor({ item }) {
    this.item = item;
    this.context = this.buildContext();
  }

  buildContext() {
    const order = this.item.order();
    const provider = this.item.provider();
    const user = order.user();
    return {
      order,
      provider,
      user,
      ...this.item.context,
    };
  }

  calculate() {
    this.calculation = DeliveryPricingDirector.sortedAdapters()
      .filter((AdapterClass => AdapterClass.isActivatedFor(this.context.provider)))
      .reduce((calculation, AdapterClass) => {
        const concreteAdapter = new AdapterClass({
          context: this.context,
          calculation,
        });
        const nextCalculationResult = Promise.await(concreteAdapter.calculate());
        return calculation.concat(nextCalculationResult);
      }, []);
    return this.calculation;
  }

  resultSheet() {
    return new DeliveryPricingSheet({
      calculation: this.calculation,
      currency: this.context.order.currency,
    });
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(DeliveryPricingDirector.adapters)
      .map(entry => entry[1])
      .sort(entry => entry.orderIndex);
  }

  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`);
    DeliveryPricingDirector.adapters.set(adapter.key, adapter);
  }
}

export {
  DeliveryPricingDirector,
  DeliveryPricingAdapter,
};
