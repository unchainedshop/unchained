import { Modules } from '@unchainedshop/types/modules';
import { Promise } from 'meteor/promise';
import { log, LogLevel } from 'meteor/unchained:logger';
import { DeliveryPricingCalculation } from './DeliveryPricingSheet';
import { DeliveryPricingSheet } from './DeliveryPricingSheet';
import { User } from '@unchainedshop/types/user';
import { Context } from '@unchainedshop/types/api';
import { Order, OrderDelivery } from '@unchainedshop/types/orders';
import { DiscountConfiguration } from '@unchainedshop/types/discounts';

interface Discount {
  discountId: string;
  configuration: DiscountConfiguration;
}

interface DeliveryPricingContext {
  user?: User;
  currency?: string;
  country?: string;
  quantity?: number;
  order?: Order;
  orderDelivery?: OrderDelivery;
  deliveryProvider?: any; // TODO: Replace with delivery provider
  discounts: Array<Discount>;
}

class DeliveryPricingAdapter {
  static key = '';

  static label = '';

  static version = '';

  static orderIndex = 0;

  static isActivatedFor() {
    return false;
  }

  public requestContext: Context;

  public context: DeliveryPricingContext;
  public discounts: Array<Discount>;
  public calculation: DeliveryPricingSheet;
  public result: DeliveryPricingSheet;

  constructor(
    {
      pricingContext,
      calculation,
      discounts,
    }: {
      pricingContext: DeliveryPricingContext;
      calculation: Array<DeliveryPricingCalculation>;
      discounts: Array<Discount>;
    },
    requestContext: Context
  ) {
    this.requestContext = requestContext;
    this.context = pricingContext;
    this.discounts = discounts;

    const { currency } = pricingContext;
    this.calculation = new DeliveryPricingSheet({ calculation, currency });
    this.result = new DeliveryPricingSheet({ currency });
  }

  calculate(): Array<DeliveryPricingCalculation> {
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

class DeliveryPricingDirector {
  private context: Context;
  private pricingContext: DeliveryPricingContext;
  private calculation: Array<DeliveryPricingCalculation>;

  constructor({ item, providerContext, ...pricingContext }, context: Context) {
    this.pricingContext = {
      discounts: [],
      /* @ts-ignore */
      ...this.buildContext(item, providerContext),
      ...context,
    };
  }

  static buildContext(item: OrderDelivery, providerContext: any) {
    if (!item) {
      return {
        ...providerContext,
      };
    }
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
      country: order.countryCode,
      ...item.context,
    };
  }

  calculate() {
    this.calculation = DeliveryPricingDirector.sortedAdapters()
      .filter((AdapterClass) => AdapterClass.isActivatedFor(this.context))
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
          log(error, { level: LogLevel.Error });
        }
        return calculation;
      }, []);
    return this.calculation;
  }

  resultSheet() {
    return new DeliveryPricingSheet({
      calculation: this.calculation,
      currency: this.context.currency,
      quantity: this.context.quantity,
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
