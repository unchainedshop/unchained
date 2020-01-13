import { Promise } from 'meteor/promise';
import { log } from 'meteor/unchained:core-logger';
import { DeliveryPricingSheet } from './sheet';

class DeliveryPricingAdapter {
  static key = '';

  static label = '';

  static version = '';

  static orderIndex = 0;

  static isActivatedFor() {
    return false;
  }

  constructor({ context, calculation, discounts }) {
    this.context = context;
    this.discounts = discounts;

    const { currency } = context;
    this.calculation = new DeliveryPricingSheet({ calculation, currency });
    this.result = new DeliveryPricingSheet({ currency });
  }

  calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) =>
      this.log(`Delivery Calculation -> ${category} ${amount}`)
    );
    return resultRaw;
  }

  log(message, { level = 'debug', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class DeliveryPricingDirector {
  constructor({ item, ...context }) {
    this.context = {
      discounts: [],
      ...this.constructor.buildContext(item),
      ...context
    };
  }

  static buildContext(item) {
    if (!item) return {};
    const order = item.order();
    const provider = item.provider();
    const user = order.user();
    const discounts = order.discounts();
    return {
      provider,
      order,
      user,
      discounts,
      currency: order.currency,
      country: order.countryCode
    };
  }

  calculate() {
    this.calculation = DeliveryPricingDirector.sortedAdapters()
      .filter(AdapterClass =>
        AdapterClass.isActivatedFor(this.context.provider)
      )
      .reduce((calculation, AdapterClass) => {
        const discounts = this.context.discounts
          .map(discount => ({
            discountId: discount._id,
            configuration: discount.discountConfigurationForCalculation(
              AdapterClass.key
            )
          }))
          .filter(({ configuration }) => configuration !== null);
        try {
          const concreteAdapter = new AdapterClass({
            context: this.context,
            calculation,
            discounts
          });
          const nextCalculationResult = Promise.await(
            concreteAdapter.calculate()
          );
          return calculation.concat(nextCalculationResult);
        } catch (error) {
          log(error, { level: 'error' });
        }
        return calculation;
      }, []);
    return this.calculation;
  }

  resultSheet() {
    return new DeliveryPricingSheet({
      calculation: this.calculation,
      currency: this.context.currency,
      quantity: this.context.quantity
    });
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(DeliveryPricingDirector.adapters)
      .map(entry => entry[1])
      .sort(entry => entry.orderIndex);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    DeliveryPricingDirector.adapters.set(adapter.key, adapter);
  }
}

export { DeliveryPricingDirector, DeliveryPricingAdapter };
