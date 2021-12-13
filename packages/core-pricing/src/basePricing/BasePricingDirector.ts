import { Context } from '@unchainedshop/types/api';
import { Discount } from '@unchainedshop/types/discounting';
import {
  Order,
  OrderDelivery,
  OrderDiscount,
} from '@unchainedshop/types/orders';
import { User } from '@unchainedshop/types/user';
import { log, LogLevel } from 'meteor/unchained:logger';
import { IPricingAdapter } from './BasePricingAdapter';

interface BasePricingContext {
  order?: Order;
  user?: User;
  discounts?: Array<OrderDiscount>;
}

export class BasePricingDirector<
  PricingContext extends BasePricingContext,
  Calculation
> {
  public requestContext: Context;
  public pricingContext: PricingContext;
  public calculation: Array<Calculation>;

  constructor(pricingContext: any, requestContext: Context) {
    this.requestContext = requestContext;
    this.pricingContext = this.buildPricingContext(pricingContext);
  }

  buildPricingContext(pricingContext: any): PricingContext {
    return {
      discounts: [],
      ...pricingContext,
    };
  }

  async calculate() {
    this.calculation = await BasePricingDirector.sortedAdapters()
      .filter(
        async (Adapter) =>
          await Adapter.isActivatedFor({
            ...this.pricingContext,
            ...this.requestContext,
          })
      )
      .reduce(async (calculation, Adapter) => {
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

          const nextCalculationResult = await concreteAdapter.calculate();

          return calculation.concat(nextCalculationResult);
        } catch (error) {
          log(error, { level: LogLevel.Error });
        }
        return calculation;
      }, []);

    return this.calculation;
  }

  static Adapters = new Map();

  static sortedAdapters() {
    return Array.from(BasePricingDirector.Adapters.values()).sort(
      (left, right) => left.orderIndex - right.orderIndex
    );
  }

  static registerAdapter(Adapter: IPricingAdapter) {
    log(
      `${this.name} -> Registered ${Adapter.key} ${Adapter.version} (${Adapter.label})`
    );
    BasePricingDirector.Adapters.set(Adapter.key, Adapter);
  }
}
