import {
  BasePricingAdapterContext,
  BasePricingContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from '@unchainedshop/types/pricing';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BaseDirector } from './BaseDirector';

export const BasePricingDirector = <
  Context extends BasePricingContext,
  AdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  Adapter extends IPricingAdapter<
    AdapterContext,
    Calculation,
    IPricingSheet<Calculation>
  >
>(
  directorName: string
): IPricingDirector<Context, AdapterContext, Calculation, Adapter> => {
  const baseDirector = BaseDirector<Adapter>(directorName, {
    adapterSortKey: 'orderIndex',
  });

  let calculation: Array<Calculation> = [];
  let context: AdapterContext | null = null;

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

    getCalculation: () => calculation,
    getContext: () => context,

    actions: (pricingContext, requestContext) => {
      return {
        calculate: async () => {
          const context = await director.buildPricingContext(
            pricingContext,
            requestContext
          );

          const adapters = baseDirector
            .getAdapters()
            .filter(async (Adapter) => await Adapter.isActivatedFor(context));

          calculation = await adapters.reduce(
            async (previousPromise, Adapter) => {
              const calculation = await previousPromise;
              const discounts = context.discounts
                .map((discount) => ({
                  discountId: discount.discountId,
                  configuration:
                    requestContext.modules.orders.discounts.configurationForPricingAdapterKey(
                      Adapter.key,
                      calculation
                    ),
                }))
                .filter(({ configuration }) => configuration !== null);

              try {
                const adapter = Adapter.actions({
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

        resultSheet: () => null,
      };
    },
  };

  return director;
};
