import { Discount } from '@unchainedshop/types/discount';
import {
  BasePricingAdapterContext,
  BasePricingContext,
  IBasePricingDirector,
  IPricingAdapter, IPricingSheet,
  PricingCalculation
} from '@unchainedshop/types/pricing';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BaseDirector } from './BaseDirector';

export const BasePricingDirector = <
  DirectorContext extends BasePricingContext,
  AdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  Adapter extends IPricingAdapter<
    AdapterContext,
    Calculation,
    IPricingSheet<Calculation>
  >
>(
  directorName: string
): IBasePricingDirector<
  DirectorContext,
  AdapterContext,
  Calculation,
  Adapter
> => {
  const baseDirector = BaseDirector<Adapter>(directorName, {
    adapterSortKey: 'orderIndex',
  });

  let calculation: Array<Calculation> = [];
  let context: AdapterContext | null = null;

  const director = {
    ...baseDirector,

    getCalculation: () => calculation,
    getContext: () => context,

    actions: async (pricingContext, requestContext, buildPricingContext) => {
      const context = await buildPricingContext(pricingContext, requestContext);

      const { services, modules, res, req, ...other } = context

      return {
        calculate: async () => {
          const Adapters = baseDirector.getAdapters({
            adapterFilter: async (Adapter) => {
              return await Adapter.isActivatedFor(context);
            },
          });

          calculation = await Adapters.reduce(
            async (previousPromise, Adapter) => {
              const resolvedCalculation = await previousPromise;
              const discounts: Array<Discount> = await Promise.all(
                context.discounts.map(async (discount) => ({
                  discountId: discount._id,
                  configuration:
                    await context.modules.orders.discounts.configurationForPricingAdapterKey(
                      discount,
                      Adapter.key,
                      context
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
