import { IProductPricingAdapter } from '@unchainedshop/types/products.pricing';
import { ProductPricingAdapter } from 'meteor/unchained:core-products';

const roundToNext = (value, precision) =>
  value % precision === precision / 2
    ? value + precision / 2
    : value + (precision - (value % precision));

// String is referencing to a currency
interface PriceRoundSettings {
  configurations: Record<string, number>;
  defaultPrecision: number;
  skip: Array<string>;
}

const ProductPriceRoundSettings: PriceRoundSettings = {
  configurations: {},
  defaultPrecision: 50,
  skip: [],
};

export const configureProductPriceRounding = ({
  configurations,
  defaultPrecision,
  skip,
}: PriceRoundSettings) => {
  if (defaultPrecision)
    ProductPriceRoundSettings.defaultPrecision = defaultPrecision;
  if (configurations) ProductPriceRoundSettings.configurations = configurations;
  if (skip?.length) ProductPriceRoundSettings.skip = skip;
};

export const ProductPriceRound: IProductPricingAdapter & {
  configure: (params: PriceRoundSettings) => void;
} = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.price-round',
  version: '1.0',
  label: 'Round product price to the next precision number',
  orderIndex: 2,

  isActivatedFor: async () => {
    return true;
  },

  configure: configureProductPriceRounding,

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { currency, quantity } = params.context;
        const { configurations, skip, defaultPrecision } =
          ProductPriceRoundSettings;
        const { calculation = [] } = pricingAdapter.calculationSheet;

        if (skip?.indexOf(currency) !== -1) return await pricingAdapter.calculate();

        const roundPrecision = configurations?.[currency] || defaultPrecision;

        if (calculation?.length && roundPrecision) {
          const [productPrice] = calculation;
          pricingAdapter.resetCalculation();
          pricingAdapter.resultSheet.addItem({
            amount: roundToNext(productPrice.amount, roundPrecision) * quantity,
            isTaxable: productPrice.isTaxable,
            isNetPrice: productPrice.isNetPrice,
            meta: { adapter: ProductPriceRound.key },
          });
        }

        return await pricingAdapter.calculate();
      },
    };
  },
};
