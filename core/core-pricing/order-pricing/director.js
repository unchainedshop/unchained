import { log } from 'meteor/unchained:core-logger';
import { OrderPricingSheet } from './sheet';

class OrderPricingAdapter {
  static key = ''
  static label = ''
  static version = ''
  static orderIndex = 0
  static isActivatedFor() {
    return false;
  }

  constructor({ context, calculation, discounts }) {
    this.context = context;
    const { currency } = this.context.order;
    this.discounts = discounts;
    this.calculation = new OrderPricingSheet({ calculation, currency });
    this.result = new OrderPricingSheet({ currency });
  }

  calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) =>
      log(`Order Calculation -> ${category} ${amount}`));
    return resultRaw;
  }

  log(message) { // eslint-disable-line
    return log(message);
  }
}

class OrderPricingDirector {
  constructor({ item }) {
    this.item = item;
    this.context = this.buildContext();
  }

  buildContext() {
    const order = this.item;
    const user = order.user();
    const items = order.items();
    const delivery = order.delivery();
    const payment = order.payment();
    const discounts = order.discounts();
    return {
      order,
      items,
      user,
      delivery,
      payment,
      discounts,
    };
  }

  calculate() {
    this.calculation = OrderPricingDirector.sortedAdapters()
      .filter((AdapterClass => AdapterClass.isActivatedFor(this.context.order)))
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
        return calculation.concat(concreteAdapter.calculate());
      }, []);
    return this.calculation;
  }

  resultSheet() {
    return new OrderPricingSheet({
      calculation: this.calculation,
      currency: this.context.order.currency,
    });
  }

  static adapters = new Map();
  static sortedAdapters() {
    return Array.from(OrderPricingDirector.adapters)
      .map(entry => entry[1])
      .sort(entry => entry.orderIndex);
  }
  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`);
    OrderPricingDirector.adapters.set(adapter.key, adapter);
  }
}

export {
  OrderPricingDirector,
  OrderPricingAdapter,
};
