import { Promise } from 'meteor/promise';
import { log } from 'meteor/unchained:core-logger';
import { ProductPricingSheet } from './sheet';

class ProductPricingAdapter {
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

    const { currency, quantity } = context;
    this.calculation = new ProductPricingSheet({
      calculation,
      currency,
      quantity
    });
    this.result = new ProductPricingSheet({ currency, quantity });
  }

  calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) =>
      this.log(`Item Calculation -> ${category} ${amount}`)
    );
    return resultRaw;
  }

  resetCalculation() {
    // revert old prices
    this.calculation.filterBy().forEach(({ amount, ...row }) => {
      this.result.calculation.push({
        ...row,
        amount: amount * -1
      });
    });
  }

  // eslint-disable-next-line
  log(message, { level = 'debug', ...options } = {}) {
    return log(message, { level, ...options });
  }
}

class ProductPricingDirector {
  constructor({ item, ...context }) {
    this.context = {
      discounts: [],
      ...this.constructor.buildContext(item),
      ...context
    };
  }

  static buildContext(item) {
    if (!item) return {};
    const product = item.product();
    const order = item.order();
    const user = order.user();
    const discounts = order.discounts();
    return {
      quantity: item.quantity,
      product,
      order,
      user,
      discounts,
      currency: order.currency,
      country: order.countryCode
    };
  }

  calculate() {
    this.calculation = ProductPricingDirector.sortedAdapters()
      .filter(AdapterClass => AdapterClass.isActivatedFor(this.context))
      .reduce((calculation, AdapterClass) => {
        const discounts = this.context.discounts
          .map(discount => ({
            discountId: discount._id,
            configuration: discount.configurationForPricingAdapterKey(
              AdapterClass.key,
              calculation
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
          if (!nextCalculationResult) return null;
          if (!calculation) return nextCalculationResult;
          return calculation.concat(nextCalculationResult);
        } catch (error) {
          log(error, { level: 'error' });
        }
        return calculation;
      }, null);
    return this.calculation;
  }

  resultSheet() {
    return new ProductPricingSheet({
      calculation: this.calculation,
      currency: this.context.currency,
      quantity: this.context.quantity
    });
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(ProductPricingDirector.adapters)
      .map(entry => entry[1])
      .sort((left, right) => left.orderIndex - right.orderIndex);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    ProductPricingDirector.adapters.set(adapter.key, adapter);
  }
}

export { ProductPricingDirector, ProductPricingAdapter };
