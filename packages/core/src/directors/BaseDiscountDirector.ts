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

  const director: IDiscountDirector<DiscountConfigurationType> = {
    ...baseDirector,

    actions: async function (discountContext, unchainedAPI) {
      // Use regular function instead of arrow function to get proper 'this' binding
      // Arrow functions inside will inherit 'this' from this outer function
      const context = { ...discountContext, ...unchainedAPI };

      return {
        resolveDiscountAdapterFromStaticCode: async (options) => {
          if (!context.order) return null;

          const discounts = await Promise.all(
            this.getAdapters()
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

        findSystemDiscounts: async () => {
          if (!context.order) return [];
          const discounts = await Promise.all(
            this.getAdapters().map(async (Adapter) => {
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

  return director;
};
