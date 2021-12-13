import { _ID } from '@unchainedshop/types/common';
import { Modules } from '@unchainedshop/types/modules';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { Order, OrderDelivery } from '@unchainedshop/types/orders';
import { Context } from '@unchainedshop/types/api';
import { log, LogLevel } from 'meteor/unchained:logger';
import { OrderPricingCalculation } from '.';
import { OrderPricingSheet } from './OrderPricingSheet';

interface OrderPricingContext {
  modules: Modules;
  userId?: string;
  order?: Order; // TODO: Replace with order type
  orderItems?: Array<any>; // TODO: Replace with order items type
  orderDelivery?: OrderDelivery;
  payment: PaymentProvider;
  discounts: Array<any>; // TODO: Define Discounting Adapter class type
}

class OrderPricingAdapter {
  static key = '';

  static label = '';

  static version = '';

  static orderIndex = 0;

  static isActivatedFor() {
    return false;
  }

  public context: OrderPricingContext;
  public discounts: Array<string>;
  public calculation: OrderPricingSheet;
  public result: OrderPricingSheet;

  constructor({
    context,
    calculation,
    discounts,
  }: {
    context: Context;
    calculation: Array<OrderPricingCalculation>;
    discounts: Array<any>;
  }) {
    this.context = context;
    const { currency } = this.context.order;
    this.discounts = discounts;
    this.calculation = new OrderPricingSheet({ calculation, currency });
    this.result = new OrderPricingSheet({ currency });
  }

  async calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) =>
      this.log(`Order Calculation -> ${category} ${amount}`)
    );
    return resultRaw;
  }

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class OrderPricingDirector {
  private context: Context;

  constructor({ order, context }: { order: any; context: Context}) {
    this.context = this.buildContext(order, context);
  }

  buildContext(order, context) {

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
      .filter((AdapterClass) => AdapterClass.isActivatedFor(this.context.order))
      .reduce((calculation, AdapterClass) => {
        const discounts = this.context.discounts
          .map((discount) => ({
            discountId: discount._id,
            configuration: discount.configurationForPricingAdapterKey(
              AdapterClass.key,
              calculation
            ),
          }))
          .filter(({ configuration }) => configuration !== null);
        try {
          const concreteAdapter = new AdapterClass({
            context: this.context,
            calculation,
            discounts,
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
    return new OrderPricingSheet({
      calculation: this.calculation,
      currency: this.context.order.currency,
    });
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(OrderPricingDirector.adapters)
      .map((entry) => entry[1])
      .sort((left, right) => left.orderIndex - right.orderIndex);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    OrderPricingDirector.adapters.set(adapter.key, adapter);
  }
}

export { OrderPricingDirector, OrderPricingAdapter };
