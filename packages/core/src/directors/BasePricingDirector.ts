import { BaseDirector, type IBaseDirector, type PricingCalculation } from '@unchainedshop/utils';
import type {
  BasePricingAdapterContext,
  BasePricingContext,
  IPricingAdapter,
} from './BasePricingAdapter.ts';
import type { IPricingSheet } from './BasePricingSheet.ts';
import { OrderDiscountDirector } from './OrderDiscountDirector.ts';
import { createLogger } from '@unchainedshop/logger';
import type { Modules } from '../modules.ts';

const logger = createLogger('unchained:core');

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
  Context = { modules: Modules },
> = IBaseDirector<Adapter> & {
  buildPricingContext: (
    pricingContext: PricingContext,
    unchainedAPI: Context,
  ) => Promise<PricingAdapterContext>;

  rebuildCalculation: (pricingContext: PricingContext, unchainedAPI: Context) => Promise<Calculation[]>;

  calculationSheet: (pricingContext: PricingContext, calculation: Calculation[]) => PricingAdapterSheet;
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
      throw new Error('Method not implemented');
    },

    calculationSheet() {
      throw new Error('Method not implemented');
    },

    async rebuildCalculation(this: typeof director, pricingContext, unchainedAPI) {
      const context = await this.buildPricingContext(pricingContext, unchainedAPI);

      let calculation: Calculation[] | null = [];

      const Adapters = baseDirector.getAdapters({
        adapterFilter: (Adapter) => {
          return Adapter.isActivatedFor(context);
        },
      });

      calculation = await Adapters.reduce(
        async (previousPromise, Adapter) => {
          const resolvedCalculation = await previousPromise;
          if (!resolvedCalculation) return null;

          const discounts: (Discount<any> | null)[] = await Promise.all(
            context.discounts.map(async (orderDiscount) => {
              // TODO: We shouldn't need to fetch this here, most probably we already have an order in context
              // 1. it should propably be required to pass an order
              // 2. we should pass the order in the pricing context or pricing adapter context
              // 3. it can't be different orders for different discounts in the same calculation rebuild
              const order = await unchainedAPI.modules.orders.findOrder({
                orderId: orderDiscount.orderId,
              });
              const DiscountAdapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
              if (!DiscountAdapter) return null;

              const adapter = await DiscountAdapter.actions({
                context: { order: order!, orderDiscount, code: orderDiscount.code, ...unchainedAPI },
              });

              const configuration = adapter.discountForPricingAdapterKey({
                pricingAdapterKey: Adapter.key,
                calculationSheet: this.calculationSheet(pricingContext, resolvedCalculation),
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
              calculationSheet: this.calculationSheet(pricingContext, resolvedCalculation),
              discounts: discounts.filter((d) => d?.configuration !== null) as Discount<any>[],
            });

            const nextCalculationResult = await adapter.calculate();
            if (!nextCalculationResult) return null;
            calculation = resolvedCalculation.concat(nextCalculationResult);
            return calculation;
          } catch (error) {
            logger.error(error);
          }
          return resolvedCalculation;
        },
        Promise.resolve([] as Calculation[]),
      );

      return calculation || ([] as Calculation[]);
    },
  };

  return director;
};
