import { log } from 'meteor/unchained:core-logger';
import { PaymentPricingSheet } from './sheet';

class PaymentPricingAdapter {
  static key = '';

  static label = '';

  static version = '';

  static orderIndex = 0;

  static isActivatedFor() {
    return false;
  }

  constructor({ context, calculation }) {
    this.context = context;
    const { currency } = this.context.order;
    this.calculation = new PaymentPricingSheet({ calculation, currency });
    this.result = new PaymentPricingSheet({ currency });
  }

  async calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) =>
      this.log(`Payment Calculation -> ${category} ${amount}`)
    );
    return resultRaw;
  }

  log(message, { level = 'verbose', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class PaymentPricingDirector {
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
      ...this.item.context
    };
  }

  async calculate() {
    this.calculation = await PaymentPricingDirector.sortedAdapters()
      .filter(AdapterClass =>
        AdapterClass.isActivatedFor(this.context.provider)
      )
      .reduce(async (accumulator, AdapterClass) => {
        const calculation = await accumulator;
        try {
          const concreteAdapter = new AdapterClass({
            context: this.context,
            calculation
          });
          const nextCalculationResult = await concreteAdapter.calculate();
          return calculation.concat(nextCalculationResult);
        } catch (error) {
          log(error, { level: 'error' });
        }
        return calculation;
      }, []);
    return this.calculation;
  }

  resultSheet() {
    return new PaymentPricingSheet({
      calculation: this.calculation,
      currency: this.context.order.currency
    });
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(PaymentPricingDirector.adapters)
      .map(entry => entry[1])
      .sort(entry => entry.orderIndex);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    PaymentPricingDirector.adapters.set(adapter.key, adapter);
  }
}

export { PaymentPricingDirector, PaymentPricingAdapter };
