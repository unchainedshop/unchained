import { Context } from '@unchainedshop/types/api';
import { IPricingDirector, IPricingAdapter, BasePricingContext, BaseCalculation } from '@unchainedshop/types/pricing';
import { Discount } from '@unchainedshop/types/discounting';
import { Order, OrderDiscount } from '@unchainedshop/types/orders';
import { User } from '@unchainedshop/types/user';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BaseDirector } from './BaseDirector';
import { BasePricingAdapter, BasePricingAdapterContext, BasePricingCategory, } from './BasePricingAdapter';
import { IBaseAdapter } from '@unchainedshop/types/common';

type Calculation = BaseCalculation<BasePricingCategory>;

const baseDirector =
  BaseDirector<IPricingAdapter<BasePricingContext, Calculation>>();

export const BasePricingDirector: IPricingDirector<BasePricingContext, Calculation> = {
  ...baseDirector,

  buildPricingContext(pricingContext: any) {
    return {
      discounts: [],
      ...pricingContext,
    };
  },

  actions: (pricingContext: any, requestContext: Context) => {
    const context = {
      ...BasePricingDirector.buildPricingContext(pricingContext),
      ...requestContext,
    };

    return {
      calculate: async () => {
        const adapters = baseDirector
          .getAdapters()
          .filter(async (Adapter) => await Adapter.isActivatedFor(context));

        const calculation = await adapters.reduce(
          async (previousPromise, Adapter) => {
            const calculation = await previousPromise;
            const discounts = context.pricingContext.discounts
              .map((discount) => ({
                discountId: discount._id,
                // TODO: Use modules to get configuration
                /* @ts-ignore */
                configuration: discount.configurationForPricingAdapterKey(
                  Adapter.key,
                  calculation
                ),
              }))
              .filter(
                ({ configuration }) => configuration !== null
              ) as Array<Discount>;

            try {
              const adapter = Adapter.get({
                context,
                calculation,
                discounts,
              });

              const nextCalculationResult = await adapter.calculate();

              return calculation.concat(nextCalculationResult);
            } catch (error) {
              log(error, { level: LogLevel.Error });
            }
            return calculation;
          },
          Promise.resolve([] as Array<Calculation>)
        );

        return calculation;
      },
    };
  },
};
