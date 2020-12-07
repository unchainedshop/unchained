import fetch from 'isomorphic-unfetch';
import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';
import { Countries } from 'meteor/unchained:core-countries';
import Cache from '../utils/cache';

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

export default getFiatexchangeRateForCrypto;

class ProductPriceCoinbaseExchange extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.price-coinbase-exchange';

  static version = '1.0';

  static label = 'Convert EUR to crypto with curreny exchange rate';

  static orderIndex = 1;

  static isActivatedFor({ currency }) {
    return SUPPORTED_CURRENCIES.indexOf(currency.toUpperCase()) !== -1;
  }

  async calculate() {
    const { product, country, quantity, currency } = this.context;
    const defaultCurrency = Countries.resolveDefaultCurrencyCode({
      isoCode: country,
    });
    const productPrice = product.price({ country, currency: defaultCurrency });
    if (!productPrice || !productPrice?.amount) return null;

    const rate = await getFiatexchangeRateForCrypto(defaultCurrency, currency);

    const convertedAmount = productPrice?.amount * rate;
    this.resetCalculation();
    this.result.addItem({
      amount: convertedAmount * quantity,
      isTaxable: productPrice?.isTaxable,
      isNetPrice: productPrice?.isNetPrice,
      meta: { adapter: this.constructor.key },
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductPriceCoinbaseExchange);
