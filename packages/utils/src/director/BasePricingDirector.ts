import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector, IBaseDirector } from './BaseDirector.js';
import {
  BasePricingAdapterContext,
  BasePricingContext,
  IPricingAdapter,
  IPricingAdapterActions,
} from './BasePricingAdapter.js';
import { IPricingSheet, PricingCalculation } from './BasePricingSheet.js';
export interface Discount<DiscountConfiguration> {
  discountId: string;
  configuration: DiscountConfiguration;
}

export type IPricingDirector<
  PricingContext extends BasePricingContext,
  Calculation extends PricingCalculation,
  PricingAdapterContext extends BasePricingAdapterContext,
  PricingAdapterSheet extends IPricingSheet<Calculation>,
  Adapter extends IPricingAdapter<PricingAdapterContext, Calculation, PricingAdapterSheet>,
  Context = unknown,
> = IBaseDirector<Adapter> & {
  buildPricingContext: (
    context: PricingContext,
    unchainedAPI: Context,
  ) => Promise<PricingAdapterContext>;
  actions: (
    pricingContext: PricingContext,
    unchainedAPI: Context,
    buildPricingContext?: (
      pricingCtx: PricingContext,
      _unchainedAPI: Context,
    ) => Promise<PricingAdapterContext>,
  ) => Promise<
    IPricingAdapterActions<Calculation, PricingAdapterContext> & {
      calculationSheet: () => PricingAdapterSheet;
    }
  >;
};

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
  PricingAdapter,
  any
> => {
  const baseDirector = BaseDirector<PricingAdapter>(directorName, {
    adapterSortKey: 'orderIndex',
  });

  const director: IPricingDirector<
    DirectorContext,
    Calculation,
    AdapterContext,
    IPricingSheet<Calculation>,
    PricingAdapter,
    any
  > = {
    ...baseDirector,
    buildPricingContext: async () => {
      return {} as AdapterContext;
    },
    actions: async (pricingContext, unchainedAPI, buildPricingContext) => {
      const context = await buildPricingContext(pricingContext, unchainedAPI);

      let calculation: Array<Calculation> = [];

      const actions: IPricingAdapterActions<Calculation, AdapterContext> = {
        async calculate() {
          const Adapters = baseDirector.getAdapters({
            adapterFilter: (Adapter) => {
              return Adapter.isActivatedFor(context);
            },
          });

          calculation = await Adapters.reduce(async (previousPromise, Adapter) => {
            const resolvedCalculation = await previousPromise;
            if (!resolvedCalculation) return null;

            const discounts: Array<Discount<any>> = await Promise.all(
              context.discounts.map(async (discount) => ({
                discountId: discount._id,
                configuration:
                  await unchainedAPI.modules.orders.discounts.configurationForPricingAdapterKey(
                    discount as any,
                    Adapter.key,
                    this.calculationSheet(),
                    context as any,
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
      };

      return actions as IPricingAdapterActions<Calculation, AdapterContext> & {
        calculationSheet: () => IPricingSheet<Calculation>;
      };
    },
  };

  return director;
};
