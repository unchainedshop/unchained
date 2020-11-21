import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';

import getFiatexchangeRateForCrypto from '../utils/getFiatexchangeRateForCrypto';
import AVAILABLE_CURRENCIES from '../constants/available-exchanges';

class ProductPriceEUR2CryptoExchange extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.price-EUR-crypto-exchange';

  static version = '1.0';

  static label = 'Convert EUR to crypto with curreny exchange rate';

  static orderIndex = 1;

  static isActivatedFor({ currency }) {
    return AVAILABLE_CURRENCIES.crypto.indexOf(currency.toUpperCase()) !== -1;
  }

  async calculate() {
    const { product, country, quantity, currency } = this.context;
    const EURprice = product.price({ country, currency: 'EUR' });
    if (!EURprice || !EURprice?.amount) return null;

    const rate = await getFiatexchangeRateForCrypto('EUR', currency);

    const convertedAmount = EURprice?.amount * rate;
    this.resetCalculation();
    this.result.addItem({
      amount: convertedAmount * quantity,
      isTaxable: EURprice?.isTaxable,
      isNetPrice: EURprice?.isNetPrice,
      meta: { adapter: this.constructor.key },
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductPriceEUR2CryptoExchange);
