import { Promise } from 'meteor/promise';
import { log } from 'meteor/unchained:core-logger';
import { ProductPricingSheet } from './sheet';

class ProductPricingAdapter {
  static key = ''

  static label = ''

  static version = ''

  static orderIndex = 0

  static isActivatedFor() {
    return false;
  }

  constructor({ context, calculation, discounts }) {
    this.context = context;
    this.discounts = discounts;

    const { currency, quantity } = context;
    this.calculation = new ProductPricingSheet({ calculation, currency, quantity });
    this.result = new ProductPricingSheet({ currency, quantity });
  }

  calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) => log(`Item Calculation -> ${category} ${amount}`));
    return resultRaw;
  }

  resetCalculation() {
    // revert old prices
    this.calculation.filterBy().forEach(({ amount, ...row }) => {
      this.result.calculation.push({
        ...row,
        amount: amount * -1,
      });
    });
  }

  log(message) { // eslint-disable-line
    return log(message);
  }
}

class ProductPricingDirector {
  constructor({ item, ...context }) {
    this.context = {
      discounts: [],
      ...this.constructor.buildContext(item),
      ...context,
    };
  }

  static buildContext(item) {
    if (!item) return { };
    const product = item.product();
    const order = item.order();
    const user = order.user();
    const discounts = order.discounts();
    return {
      item,
      quantity: item.quantity,
      currency: order.currency,
      country: order.countryCode,
      product,
      order,
      user,
      discounts,
    };
  }

  calculate() {
    this.calculation = ProductPricingDirector.sortedAdapters()
      .filter((AdapterClass => AdapterClass.isActivatedFor(this.context.product)))
      .reduce((calculation, AdapterClass) => {
        const discounts = this.context.discounts
          .map(discount => ({
            discountId: discount._id,
            configuration: discount.discountConfigurationForCalculation(AdapterClass.key),
          }))
          .filter(({ configuration }) => (configuration !== null));
        const concreteAdapter = new AdapterClass({
          context: this.context,
          calculation,
          discounts,
        });
        const nextCalculationResult = Promise.await(concreteAdapter.calculate());
        return calculation.concat(nextCalculationResult);
      }, []);
    return this.calculation;
  }

  resultSheet() {
    return new ProductPricingSheet({
      calculation: this.calculation,
      currency: this.context.currency,
      quantity: this.context.quantity,
    });
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(ProductPricingDirector.adapters)
      .map(entry => entry[1])
      .sort((left, right) => left.orderIndex > right.orderIndex);
  }

  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`);
    ProductPricingDirector.adapters.set(adapter.key, adapter);
  }
}

export {
  ProductPricingDirector,
  ProductPricingAdapter,
};
