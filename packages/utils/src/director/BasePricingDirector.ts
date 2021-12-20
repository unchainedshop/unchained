import { Discount } from '@unchainedshop/types/discounting';
import {
  BaseCalculation,
  BasePricingAdapterContext,
  BasePricingContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
} from '@unchainedshop/types/pricing';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BaseDirector } from './BaseDirector';

export const BasePricingDirector = <
  Context extends BasePricingContext,
  AdapterContext extends BasePricingAdapterContext,
  Calculation extends BaseCalculation,
  Adapter extends IPricingAdapter<
    BasePricingAdapterContext,
    Calculation,
    IPricingSheet<Calculation>
  >
>(): IPricingDirector<Context, AdapterContext, Calculation, Adapter> => {
  const baseDirector = BaseDirector<Adapter>();

  const director: IPricingDirector<
    Context,
    AdapterContext,
    Calculation,
    Adapter
  > = {
    ...baseDirector,

    buildPricingContext(pricingContext) {
      return {
        discounts: [],
        ...pricingContext,
      };
    },

    get: (pricingContext, requestContext) => {
      const context = director.buildPricingContext(
        pricingContext,
        requestContext
      );

      return {
        calculate: async () => {
          const adapters = baseDirector
            .getAdapters()
            .filter(async (Adapter) => await Adapter.isActivatedFor(context));

          const calculation = await adapters.reduce(
            async (previousPromise, Adapter) => {
              const calculation = await previousPromise;
              const discounts = context.discounts
                .map((discount) => ({
                  discountId: discount.discountId,
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

  return director;
};
