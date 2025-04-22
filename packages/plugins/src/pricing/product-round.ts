import {
  ProductPricingAdapter,
  ProductPricingDirector,
  IProductPricingAdapter,
} from '@unchainedshop/core';

interface PriceRoundSettings {
  defaultPrecision: number;
  roundTo: (value: number, precision: number, currencyCode: string) => number;
}

export const ProductRound: IProductPricingAdapter & {
  configure: (params: PriceRoundSettings) => void;
  settings: PriceRoundSettings;
} = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-round',
  version: '1.0.0',
  label: 'Round product price',
  orderIndex: 90,

  isActivatedFor: () => {
    return true;
  },

  settings: {
    defaultPrecision: 5,
    roundTo: (value: number, precision: number) => Math.round(value / precision) * precision,
  },

  configure({ defaultPrecision, roundTo }) {
    if (defaultPrecision) this.settings.defaultPrecision = defaultPrecision;
    if (roundTo) this.settings.roundTo = roundTo;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { currencyCode } = params.context;
        const { defaultPrecision, roundTo } = ProductRound.settings;
        const { calculation = [] } = params.calculationSheet;

        if (calculation?.length) {
          pricingAdapter.resultSheet().resetCalculation(params.calculationSheet);

          calculation.forEach((item) => {
            const newAmount = roundTo(item.amount, defaultPrecision, currencyCode);
            pricingAdapter.resultSheet().calculation.push({
              ...item,
              amount: newAmount,
            });
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductRound);
