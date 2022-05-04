import { IProductPricingAdapter } from '@unchainedshop/types/products.pricing';
import fetch from 'isomorphic-unfetch';
import { ProductPricingDirector, ProductPricingAdapter } from 'meteor/unchained:core-products';

import Cache from './utils/cache';

const CACHE_PERIOD = 60 * 60 * 0.1; // 10 minutes
const SUPPORTED_CURRENCIES = ['BTC', 'ETH', 'XRP', 'USDT', 'BCH', 'BSV', 'LTC', 'EOS', 'BNB', 'XTZ'];
const cache = new Cache(CACHE_PERIOD);

const getFiatexchangeRateForCrypto = async (base, target) => {
  const { data } = await cache.get(`${base}-${target}`, () =>
    fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${base}`, {
      method: 'GET',
    }).then((res) => res.json()),
  );
  return data?.rates?.[target];
};

const ProductPriceCoinbaseExchange: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.price-coinbase-exchange',
  version: '1.0',
  label: 'Convert fiat/crypto to crypto with current exchange rate',
  orderIndex: 1,

  isActivatedFor: (context) => {
    return SUPPORTED_CURRENCIES.indexOf(context.currency.toUpperCase()) !== -1;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);
    const { services, modules } = params.context;
    return {
      ...pricingAdapter,

      calculate: async () => {
        const { product, country, quantity, currency } = params.context;
        const defaultCurrency = await services.countries.resolveDefaultCurrencyCode(
          {
            isoCode: country,
          },
          params.context,
        );

        const productPrice = await modules.products.prices.price(product, {
          country,
          currency: defaultCurrency,
          quantity,
        });

        const { calculation = [] } = pricingAdapter.calculationSheet;

        if (
          !productPrice ||
          !productPrice?.amount ||
          calculation?.length ||
          defaultCurrency === currency
        )
          return pricingAdapter.calculate();

        const rate = await getFiatexchangeRateForCrypto(defaultCurrency, currency);

        if (rate > 0) {
          const convertedAmount = productPrice.amount * rate;
          pricingAdapter.resetCalculation();
          pricingAdapter.resultSheet().addItem({
            amount: convertedAmount * quantity,
            isTaxable: productPrice?.isTaxable,
            isNetPrice: productPrice?.isNetPrice,
            meta: { adapter: ProductPriceCoinbaseExchange.key },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductPriceCoinbaseExchange);
