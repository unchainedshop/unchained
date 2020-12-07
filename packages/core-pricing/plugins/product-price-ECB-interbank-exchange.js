import fetch from 'isomorphic-unfetch';
import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';

import roundToNext50 from '../utils/roundToNext50';
import Cache from '../utils/cache';

const CACHE_PERIOD = 60 * 60 * 0.5; // 30 minutes

const SUPPORTED_CURRENCIES = [
  'USD',
  'JPY',
  'BGN',
  'CZK',
  'DKK',
  'GBP',
  'HUF',
  'PLN',
  'RON',
  'SEK',
  'CHF',
  'ISK',
  'NOK',
  'HRK',
  'RUB',
  'TRY',
  'AUD',
  'BRL',
  'CAD',
  'CNY',
  'HKD',
  'IDR',
  'ILS',
  'INR',
  'KRW',
  'MXN',
  'MYR',
  'NZD',
  'PHP',
  'SGD',
  'THB',
  'ZAR',
];

const cache = new Cache(CACHE_PERIOD);
const xmlJs = require('xml-js');

const getEURexchangeRateForCurrency = async (currency) => {
  const response = cache.get(currency, () =>
    fetch(`https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`, {
      method: 'GET',
    })
      .then((res) => res.text())
      .then((text) => JSON.parse(xmlJs.xml2json(text)))
      .then(
        (json) =>
          json.elements?.[0]?.elements
            .filter((e) => e.name.toLowerCase() === 'cube')[0]
            ?.elements[0]?.elements.filter(
              (a) => a.attributes.currency === currency
            )?.[0]?.attributes
      )
  );
  return response;
};

class ProductPriceECBIntraBankExchange extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.price-ECB-intrabank-exchange';

  static version = '1.0';

  static label = 'Convert EUR to X with curreny exchange rate';

  static orderIndex = 1;

  static isActivatedFor({ currency }) {
    return SUPPORTED_CURRENCIES.indexOf(currency) !== -1;
  }

  async calculate() {
    const { product, country, quantity, currency } = this.context;
    const EURprice = product.price({ country, currency: 'EUR' });
    if (!EURprice || !EURprice?.amount) return super.calculate();

    const exchange = await getEURexchangeRateForCurrency(currency);
    const convertedAmount = EURprice.amount * exchange.rate;
    this.resetCalculation();
    this.result.addItem({
      amount: roundToNext50(convertedAmount) * quantity,
      isTaxable: EURprice.isTaxable,
      isNetPrice: EURprice.isNetPrice,
      meta: { adapter: this.constructor.key },
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductPriceECBIntraBankExchange);
