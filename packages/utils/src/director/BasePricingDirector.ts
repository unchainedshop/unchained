import { Discount } from '@unchainedshop/types/discount';
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
    buildPricingContext: (pricingContext, requestContext) => {
      return {
        discounts: [],
        ...pricingContext,
        ...requestContext,
      };
    },

    getCalculation: () => calculation,
    getContext: () => context,

    actions: async (pricingContext, requestContext) => {
      context = await director.buildPricingContext(
        pricingContext,
        requestContext
      );

      return {
        calculate: async () => {
          const Adapters = baseDirector
            .getAdapters()
            .filter(async (Adapter) => await Adapter.isActivatedFor(context));

          calculation = await Adapters.reduce(
            async (previousPromise, Adapter) => {
              const resolvedCalculation = await previousPromise;
              const discounts: Array<Discount> = await Promise.all(
                context.discounts.map(async (discount) => ({
                  discountId: discount._id,
                  configuration:
                    await requestContext.modules.orders.discounts.configurationForPricingAdapterKey(
                      discount,
                      Adapter.key,
                      requestContext
                    ),
                }))
              );

              try {
                const adapter = Adapter.actions({
                  context,
                  calculation: resolvedCalculation,
                  discounts: discounts.filter(
                    ({ configuration }) => configuration !== null
                  ),
                });

                const nextCalculationResult = await adapter.calculate();
                if (!nextCalculationResult) return null;
                if (!resolvedCalculation) return null;

                return resolvedCalculation.concat(nextCalculationResult);
              } catch (error) {
                log(error, { level: LogLevel.Error });
              }
              return resolvedCalculation;
            },
            Promise.resolve([])
          );

          return calculation;
        },

        resultSheet: () => null,
      };
    },
  };

  return director;
};
