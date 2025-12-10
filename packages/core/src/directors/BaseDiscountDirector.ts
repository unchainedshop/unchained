import { BaseDirector, type IBaseDirector } from '@unchainedshop/utils';
import type { DiscountContext, IDiscountAdapter } from './BaseDiscountAdapter.ts';
import type { Modules } from '../modules.ts';

export type IDiscountDirector<DiscountConfiguration> = IBaseDirector<
  IDiscountAdapter<DiscountConfiguration>
> & {
  actions: (
    discountContext: DiscountContext,
    unchainedAPI: { modules: Modules },
  ) => Promise<{
    resolveDiscountAdapterFromStaticCode: (params: {
      code: string;
    }) => Promise<IDiscountAdapter<DiscountConfiguration> | null>;
    findSystemDiscounts: () => Promise<string[]>;
  }>;
};

export const BaseDiscountDirector = <DiscountConfigurationType>(
  directorName: string,
): IDiscountDirector<DiscountConfigurationType> => {
  const baseDirector = BaseDirector<IDiscountAdapter<DiscountConfigurationType>>(directorName, {
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

          return discounts.find(({ isValid }) => isValid === true)?.Adapter || null;
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
