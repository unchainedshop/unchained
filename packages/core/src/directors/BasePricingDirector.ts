import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector, IBaseDirector, PricingCalculation } from '@unchainedshop/utils';
import { BasePricingAdapterContext, BasePricingContext, IPricingAdapter } from './BasePricingAdapter.js';
import { IPricingSheet } from './BasePricingSheet.js';
import { OrderDiscountDirector } from './OrderDiscountDirector.js';

export interface Discount<DiscountConfiguration> {
  discountId: string;
  configuration: DiscountConfiguration;
}

export type IPricingDirector<
  PricingContext extends BasePricingContext,
  Calculation extends PricingCalculation,
  PricingAdapterContext extends BasePricingAdapterContext,
  PricingAdapterSheet extends IPricingSheet<Calculation>,
  Adapter extends IPricingAdapter<PricingAdapterContext & Context, Calculation, PricingAdapterSheet>,
  Context = unknown,
> = IBaseDirector<Adapter> & {
  buildPricingContext: (
    pricingContext: PricingContext,
    unchainedAPI: Context,
  ) => Promise<PricingAdapterContext>;

  rebuildCalculation: (
    pricingContext: PricingContext,
    unchainedAPI: Context,
  ) => Promise<Array<Calculation>>;

  calculationSheet: (
    pricingContext: PricingContext,
    calculation: Array<Calculation>,
  ) => PricingAdapterSheet;
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
      throw new Error('Method not implemented');
    },

    calculationSheet() {
      throw new Error('Method not implemented');
    },

    async rebuildCalculation(pricingContext, unchainedAPI) {
      const context = await this.buildPricingContext(pricingContext, unchainedAPI);

      let calculation: Array<Calculation> = [];

      const Adapters = baseDirector.getAdapters({
        adapterFilter: (Adapter) => {
          return Adapter.isActivatedFor(context);
        },
      });

      calculation = await Adapters.reduce(async (previousPromise, Adapter) => {
        const resolvedCalculation = await previousPromise;
        if (!resolvedCalculation) return null;

        const discounts: Array<Discount<any>> = await Promise.all(
          context.discounts.map(async (orderDiscount) => {
            const order = await unchainedAPI.modules.orders.findOrder({
              orderId: orderDiscount.orderId,
            });
            const DiscountAdapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
            if (!DiscountAdapter) return null;
            const adapter = await DiscountAdapter.actions({
              context: { order, orderDiscount, code: orderDiscount.code, ...unchainedAPI },
            });

            const configuration = adapter.discountForPricingAdapterKey({
              pricingAdapterKey: Adapter.key,
              calculationSheet: this.calculationSheet(pricingContext, calculation),
            });

            return {
              discountId: orderDiscount._id,
              configuration,
            };
          }),
        );

        try {
          const adapter = Adapter.actions({
            context,
            calculationSheet: this.calculationSheet(pricingContext, calculation),
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
  };

  return director;
};
