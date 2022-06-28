import { IDiscountAdapter, IDiscountDirector } from '@unchainedshop/types/discount';
import { log } from '@unchainedshop/logger';
import { BaseDirector } from './BaseDirector';

export const BaseDiscountDirector = (directorName: string): IDiscountDirector => {
  const baseDirector = BaseDirector<IDiscountAdapter>(directorName, {
    adapterSortKey: 'orderIndex',
  });

  return {
    ...baseDirector,

    actions: async (discountContext, requestContext) => {
      const context = { ...discountContext, ...requestContext };

      return {
        resolveDiscountKeyFromStaticCode: async (options) => {
          if (!context.order) return null;

          log(`DiscountDirector -> Find user discount for static code ${options?.code}`);

          const discounts = await Promise.all(
            baseDirector
              .getAdapters()
              .filter((Adapter) => Adapter.isManualAdditionAllowed(options?.code))
              .map(async (Adapter) => {
                const adapter = await Adapter.actions({ context });
                return {
                  key: Adapter.key,
                  isValid: await adapter.isValidForCodeTriggering(options),
                };
              }),
          );

          return discounts.find(({ isValid }) => isValid === true)?.key;
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

          if (validDiscounts.length > 0) {
            log(`DiscountDirector -> Found ${validDiscounts.length} system discounts`);
          }
          return validDiscounts;
        },
      };
    },
  };
};