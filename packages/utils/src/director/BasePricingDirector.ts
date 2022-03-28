import { Discount } from '@unchainedshop/types/discount';
import {
  BasePricingAdapterContext,
  BasePricingContext,
  IPricingDirector,
  IPricingAdapter,
  IPricingSheet,
  PricingCalculation,
  IBasePricingSheet,
} from '@unchainedshop/types/pricing';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BaseDirector } from './BaseDirector';
import { BasePricingSheet } from './BasePricingSheet';

export const BasePricingDirector = <
  DirectorContext extends BasePricingContext,
  AdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  PricingAdapter extends IPricingAdapter<AdapterContext, Calculation, IPricingSheet<Calculation>>,
>(
  directorName: string,
): IPricingDirector<DirectorContext, AdapterContext, Calculation, PricingAdapter> => {
  const baseDirector = BaseDirector<PricingAdapter>(directorName, {
    adapterSortKey: 'orderIndex',
  });

  const director: IPricingDirector<DirectorContext, AdapterContext, Calculation, PricingAdapter> = {
    ...baseDirector,
    buildPricingContext: async () => {
      return {} as AdapterContext;
    },
    actions: async (pricingContext, requestContext, buildPricingContext) => {
      const context = await buildPricingContext(pricingContext, requestContext);

      let calculation: Array<Calculation> = [];
      const calculationSheet = BasePricingSheet({
        calculation,
      });
      const resultSheet = BasePricingSheet({ calculation: [] });

      return {
        calculate: async () => {
          const Adapters = baseDirector.getAdapters({
            adapterFilter: (Adapter) => {
              return Adapter.isActivatedFor(context);
            },
          });

          calculation = await Adapters.reduce(async (previousPromise, Adapter) => {
            const resolvedCalculation = await previousPromise;
            if (!resolvedCalculation) return null;

            const discounts: Array<Discount> = await Promise.all(
              context.discounts.map(async (discount) => ({
                discountId: discount._id,
                configuration: await context.modules.orders.discounts.configurationForPricingAdapterKey(
                  discount,
                  Adapter.key,
                  context,
                ),
              })),
            );

            try {
              const adapter = Adapter.actions({
                context,
                calculation: resolvedCalculation,
                discounts: discounts.filter(({ configuration }) => configuration !== null),
              });

              const nextCalculationResult = await adapter.calculate();
              if (!nextCalculationResult) return null;
              return resolvedCalculation.concat(nextCalculationResult);
            } catch (error) {
              log(error, { level: LogLevel.Error });
            }
            return resolvedCalculation;
          }, Promise.resolve([]));

          return calculation;
        },
        getCalculation: () => calculation,
        getContext: () => context,
        resultSheet: () => resultSheet,
        calculationSheet: () => calculationSheet,
      };
    },
  };

  return director;
};
