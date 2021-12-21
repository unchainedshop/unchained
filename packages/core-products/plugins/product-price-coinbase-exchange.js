import fetch from 'isomorphic-unfetch';
import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-products';
import Cache from './utils/cache';

const CACHE_PERIOD = 60 * 60 * 0.1; // 10 minutes
const SUPPORTED_CURRENCIES = [
  'BTC',
  'ETH',
  'XRP',
  'USDT',
  'BCH',
  'BSV',
  'LTC',
  'EOS',
  'BNB',
  'XTZ',
];
const cache = new Cache(CACHE_PERIOD);

const getFiatexchangeRateForCrypto = async (base, target) => {
  const { data } = await cache.get(`${base}-${target}`, () =>
    fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${base}`, {
      method: 'GET',
    }).then((res) => res.json())
  );
  return data?.rates?.[target];
};

const ADAPTER_KEY = 'shop.unchained.pricing.price-coinbase-exchange';

class ProductPriceCoinbaseExchange extends ProductPricingAdapter {
  static key = ADAPTER_KEY;

  static version = '1.0';

  static label = 'Convert fiat/crypto to crypto with current exchange rate';

  static orderIndex = 1;

  static async isActivatedFor(context) {
    return SUPPORTED_CURRENCIES.indexOf(context.currency.toUpperCase()) !== -1;
  }

  async calculate() {
    const { product, country, quantity, currency } = this.context;
    const defaultCurrency =
      this.context.services.countries.resolveDefaultCurrencyCode({
        isoCode: country,
      });
    const productPrice = product.price({
      country,
      currency: defaultCurrency,
      quantity,
    });
    const { calculation = [] } = this.calculation;
    if (!productPrice || !productPrice?.amount || calculation?.length)
      return super.calculate();

    const rate = await getFiatexchangeRateForCrypto(defaultCurrency, currency);

    const convertedAmount = productPrice?.amount * rate;
    this.resetCalculation();
    this.result.addItem({
      amount: convertedAmount * quantity,
      isTaxable: productPrice?.isTaxable,
      isNetPrice: productPrice?.isNetPrice,
      meta: { adapter: ADAPTER_KEY },
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductPriceCoinbaseExchange);
