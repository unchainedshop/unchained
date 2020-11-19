import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';

import getEURexchangeRateForCurrency from '../utils/getEURexchangeRateForCurrency';
import roundToNext50 from '../utils/roundToNext50';
import AVAILABLE_CURRENCIES from '../constants/available-exchanges';

class ProductPriceEUR2FiatExchange extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.price-EUR-fiat-exchange';

  static version = '1.0';

  static label = 'Convert EUR to X with curreny exchange rate';

  static orderIndex = 1;

  static isActivatedFor({ currency }) {
    return AVAILABLE_CURRENCIES.fiat.indexOf(currency) !== -1;
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

ProductPricingDirector.registerAdapter(ProductPriceEUR2FiatExchange);
