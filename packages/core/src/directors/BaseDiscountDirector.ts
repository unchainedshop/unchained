import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import { DiscountContext, IDiscountAdapter } from './BaseDiscountAdapter.js';

export type IDiscountDirector<DiscountConfiguration, Context> = IBaseDirector<
  IDiscountAdapter<DiscountConfiguration, Context>
> & {
  actions: (
    discountContext: DiscountContext,
    unchainedAPI: Context,
  ) => Promise<{
    resolveDiscountAdapterFromStaticCode: (params: {
      code: string;
    }) => Promise<IDiscountAdapter<DiscountConfiguration, Context>>;
    findSystemDiscounts: () => Promise<Array<string>>;
  }>;
};

export const BaseDiscountDirector = <DiscountConfigurationType, Context>(
  directorName: string,
): IDiscountDirector<DiscountConfigurationType, Context> => {
  const baseDirector = BaseDirector<IDiscountAdapter<DiscountConfigurationType, Context>>(directorName, {
    adapterSortKey: 'orderIndex',
  });

  return {
    ...baseDirector,

    actions: async (discountContext, unchainedAPI) => {
      const context = { ...discountContext, ...unchainedAPI };

      return {
        resolveDiscountAdapterFromStaticCode: async (options) => {
          if (!context.order) return null;

          const discounts = await Promise.all(
            baseDirector
              .getAdapters()
              .filter((Adapter) => Adapter.isManualAdditionAllowed(options?.code))
              .map(async (Adapter) => {
                const adapter = await Adapter.actions({ context });
                return {
                  Adapter,
                  isValid: await adapter.isValidForCodeTriggering(options),
                };
              }),
          );

          return discounts.find(({ isValid }) => isValid === true)?.Adapter;
        },

        async findSystemDiscounts() {
          if (!context.order) return [];
          const discounts = await Promise.all(
            baseDirector.getAdapters().map(async (Adapter) => {
              const adapter = await Adapter.actions({ context });
              return {
                key: Adapter.key,
                isValid: await adapter.isValidForSystemTriggering(),
              };
            }),
          );

          const validDiscounts = discounts
            .filter(({ isValid }) => isValid === true)
            .map(({ key }) => key);

          return validDiscounts;
        },
      };
    },
  };
};
