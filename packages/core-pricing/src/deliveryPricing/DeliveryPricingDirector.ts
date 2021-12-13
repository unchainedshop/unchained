import { Modules } from '@unchainedshop/types/modules';
import { Promise } from 'meteor/promise';
import { log, LogLevel } from 'meteor/unchained:logger';
import { DeliveryPricingCalculation } from './DeliveryPricingSheet';
import { DeliveryPricingSheet } from './DeliveryPricingSheet';
import { User } from '@unchainedshop/types/user';
import { Context } from '@unchainedshop/types/api';
import {
  Order,
  OrderDelivery,
  OrderDiscount,
} from '@unchainedshop/types/orders';
import { DiscountConfiguration } from '@unchainedshop/types/discounting';

export interface Discount {
  discountId: string;
  configuration: DiscountConfiguration;
}

export interface DeliveryPricingAdapterContext extends Context {
  user?: User;
  currency?: string;
  country?: string;
  quantity?: number;
  order?: Order;
  orderDelivery?: OrderDelivery;
  deliveryProvider?: any; // TODO: Replace with delivery provider
  discounts: Array<Discount>;
}

interface IDeliveryPricingAdapter {
  calculate: () => Promise<Array<DeliveryPricingCalculation>>;
}

class DeliveryPricingAdapter implements IDeliveryPricingAdapter {
  static key = '';

  static label = '';

  static version = '';

  static orderIndex = 0;

  static async isActivatedFor(context: DeliveryPricingAdapterContext) {
    return false;
  }

  public context: DeliveryPricingAdapterContext;
  public discounts: Array<Discount>;
  public calculation: DeliveryPricingSheet;
  public result: DeliveryPricingSheet;

  constructor({
    context,
    calculation,
    discounts,
  }: {
    context: DeliveryPricingAdapterContext;
    calculation: Array<DeliveryPricingCalculation>;
    discounts: Array<Discount>;
  }) {
    this.context = context;
    this.discounts = discounts;

    const { currency } = context;
    this.calculation = new DeliveryPricingSheet({ calculation, currency });
    this.result = new DeliveryPricingSheet({ currency });
  }

  async calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) =>
      this.log(`Delivery Calculation -> ${category} ${amount}`)
    );
    return resultRaw;
  }

  // eslint-disable-next-line
  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  }
}

interface DeliveryPricingContext {
  user?: User;
  currency?: string;
  country?: string;
  quantity?: number;
  order?: Order;
  orderDelivery?: OrderDelivery;
  deliveryProvider?: any; // TODO: Replace with delivery provider
  discounts: Array<OrderDiscount>;
}

class DeliveryPricingDirector {
  private requestContext: Context;
  private pricingContext: DeliveryPricingContext;
  private calculation: Array<DeliveryPricingCalculation>;

  constructor(
    { item, providerContext, ...pricingContext },
    requestContext: Context
  ) {
    this.requestContext = requestContext;
    this.pricingContext = {
      discounts: [],
      /* @ts-ignore */
      ...this.buildContext(item, providerContext, requestContext),
      ...pricingContext,
    };
  }

  static buildContext(
    item: OrderDelivery,
    providerContext: any,
    requestContext: Context
  ) {
    if (!item) return providerContext;

    // TODO: use modules
    /* @ts-ignore */
    const order = item.order();
    /* @ts-ignore */
    const provider = item.provider();
    const user = order.user();
    const discounts = order.discounts();

    return {
      provider,
      order,
      user,
      discounts,
      currency: order.currency,
      country: order.countryCode,
      ...item.context,
    };
  }

  async calculate() {
    this.calculation = DeliveryPricingDirector.sortedAdapters()
      .filter((Adapter) =>
        Adapter.isActivatedFor(this.pricingContext, this.requestContext)
      )
      .reduce((calculation, Adapter) => {
        const discounts = this.pricingContext.discounts
          .map((discount) => ({
            discountId: discount._id,
            // TODO: Use modules to get configuration
            /* @ts-ignore */
            configuration: discount.configurationForPricingAdapterKey(
              Adapter.key,
              calculation
            ),
          }))
          .filter(({ configuration }) => configuration !== null);

        try {
          const concreteAdapter = new Adapter({
            context: { ...this.pricingContext, ...this.requestContext },
            calculation,
            discounts,
          });

          const nextCalculationResult = Promise.await(
            concreteAdapter.calculate()
          );
          return calculation.concat(nextCalculationResult);
        } catch (error) {
          log(error, { level: LogLevel.Error });
        }
        return calculation;
      }, []);
    return this.calculation;
  }

  resultSheet() {
    return new DeliveryPricingSheet({
      calculation: this.calculation,
      currency: this.pricingContext.currency,
      quantity: this.pricingContext.quantity,
    });
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(DeliveryPricingDirector.adapters)
      .map((entry) => entry[1])
      .sort((left, right) => left.orderIndex - right.orderIndex);
  }

  static registerAdapter(adapter: typeof DeliveryPricingAdapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    DeliveryPricingDirector.adapters.set(adapter.key, adapter);
  }
}

export { DeliveryPricingDirector, DeliveryPricingAdapter };
