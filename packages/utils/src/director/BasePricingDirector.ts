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
import { dbIdToString } from '../utils-index';
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
    buildPricingContext: (pricingContext) => {
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

          const Adapters = baseDirector
            .getAdapters()
            .filter(async (Adapter) => await Adapter.isActivatedFor(context));

          calculation = await Adapters.reduce(
            async (previousPromise, Adapter) => {
              const calculation = await previousPromise;
              const discounts: Array<Discount> = await Promise.all(
                context.discounts.map(async (discount) => ({
                  discountId: dbIdToString(discount._id),
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
                  calculation,
                  discounts: discounts.filter(
                    ({ configuration }) => configuration !== null
                  ),
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
