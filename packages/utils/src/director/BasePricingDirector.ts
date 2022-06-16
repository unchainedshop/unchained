import { Discount } from '@unchainedshop/types/discount';
import {
  BasePricingAdapterContext,
  BasePricingContext,
  IPricingDirector,
  IPricingAdapter,
  IPricingSheet,
  PricingCalculation,
} from '@unchainedshop/types/pricing';
import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector } from './BaseDirector';
import { BasePricingSheet } from './BasePricingSheet';

export const BasePricingDirector = <
  DirectorContext extends BasePricingContext,
  AdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  PricingAdapter extends IPricingAdapter<AdapterContext, Calculation, IPricingSheet<Calculation>>,
>(
  directorName: string,
): IPricingDirector<
  DirectorContext,
  Calculation,
  AdapterContext,
  IPricingSheet<Calculation>,
  PricingAdapter
> => {
  const baseDirector = BaseDirector<PricingAdapter>(directorName, {
    adapterSortKey: 'orderIndex',
  });

  const director: IPricingDirector<
    DirectorContext,
    Calculation,
    AdapterContext,
    IPricingSheet<Calculation>,
    PricingAdapter
  > = {
    ...baseDirector,
    buildPricingContext: async () => {
      return {} as AdapterContext;
    },
    actions: async (pricingContext, requestContext, buildPricingContext) => {
      const context = await buildPricingContext(pricingContext, requestContext);

      let calculation: Array<Calculation> = [];

      return {
        async calculate() {
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
                  this.calculationSheet(),
                  context,
                ),
              })),
            );

            try {
              const adapter = Adapter.actions({
                context,
                calculationSheet: this.calculationSheet(),
                discounts: discounts.filter(({ configuration }) => configuration !== null),
              });

              const nextCalculationResult = await adapter.calculate();
              if (!nextCalculationResult) return null;
              calculation = resolvedCalculation.concat(nextCalculationResult);
              return calculation;
            } catch (error) {
              log(error, { level: LogLevel.Error });
            }
            return resolvedCalculation;
          }, Promise.resolve([]));

          return calculation;
        },
        getCalculation() {
          return calculation;
        },
        getContext() {
          return context;
        },
        calculationSheet() {
          return BasePricingSheet({
            calculation,
          });
        },
      };
    },
  };

  return director;
};
