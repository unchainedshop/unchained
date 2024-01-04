import { IProductPricingAdapter } from '@unchainedshop/types/products.pricing.js';
import { ProductPricingAdapter, ProductPricingDirector } from '@unchainedshop/core-products';
import { calculation as calcUtils } from '@unchainedshop/utils';

interface PriceRoundSettings {
  configurations: Record<string, number>;
  defaultPrecision: number;
  skip: Array<string>;
}

export const ProductPriceRoundSettings: PriceRoundSettings = {
  configurations: {},
  defaultPrecision: 50,
  skip: [],
};

export const configureProductPriceRounding = ({
  configurations,
  defaultPrecision,
  skip,
}: PriceRoundSettings) => {
  if (defaultPrecision) ProductPriceRoundSettings.defaultPrecision = defaultPrecision;
  if (configurations) ProductPriceRoundSettings.configurations = configurations;
  if (skip?.length) ProductPriceRoundSettings.skip = skip;
};

export const ProductPriceRound: IProductPricingAdapter & {
  configure: (params: PriceRoundSettings) => void;
} = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.price-round',
  version: '1.0.0',
  label: 'Round product price to the next precision number',
  orderIndex: 2,

  isActivatedFor: () => {
    return true;
  },

  configure: configureProductPriceRounding,

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { currency, quantity } = params.context;
        const { configurations, skip, defaultPrecision } = ProductPriceRoundSettings;
        const { calculation = [] } = params.calculationSheet;

        if (skip?.indexOf(currency) !== -1) return pricingAdapter.calculate();

        const roundPrecision = configurations?.[currency] || defaultPrecision;

        if (calculation?.length && roundPrecision) {
          const [productPrice] = calculation;
          pricingAdapter.resultSheet().resetCalculation(params.calculationSheet);
          pricingAdapter.resultSheet().addItem({
            amount: calcUtils.roundToNext(productPrice.amount, roundPrecision) * quantity,
            isTaxable: productPrice.isTaxable,
            isNetPrice: productPrice.isNetPrice,
            meta: { adapter: ProductPriceRound.key },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductPriceRound);
