import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';

import getEURexchangeRateForCurrency from '../utils/getEURexchangeRateForCurrency';
import roundToNext50 from '../utils/roundToNext50';

const AVAILABLE_CURRENCIES = [
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
class ProductPriceEURExchange extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.price-EUR-fiat-exchange';

  static version = '1.0';

  static label = 'Convert EUR to X with curreny exchange rate';

  static orderIndex = 1;

  static isActivatedFor({ currency }) {
    return AVAILABLE_CURRENCIES.indexOf(currency) !== -1;
  }

  async calculate() {
    const { product, country, quantity, currency } = this.context;
    const EURprice = product.price({ country, currency: 'EUR' });
    if (!EURprice || !EURprice?.amount) return null;

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

ProductPricingDirector.registerAdapter(ProductPriceEURExchange);
