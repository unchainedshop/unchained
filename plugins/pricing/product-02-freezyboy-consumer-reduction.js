import moment from 'moment';

import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';


const USER_TAG_CONSUMER = 'consumer';
const USER_TAG_STUDIO = 'studio';
const USER_TAG_PARTNER = 'partner';
const PRODUCT_TAG_FREEZYBOY = 'freezyboy';
const CURRENCY_CHF = 'CHF';

const staticPrices = { };
staticPrices[CURRENCY_CHF] = {};
staticPrices[CURRENCY_CHF][USER_TAG_CONSUMER] = 79000; // incl. mwst

class FreezyboyPrice extends ProductPricingAdapter {
  static key = 'ch.freezyboy.pricing-reduction'

  static version = '1.0'

  static label = 'Berechnung der Bestellposition: Preis'

  static orderIndex = 2

  static isActivatedFor(product) {
    if (
      product.tags
      && product.tags.length > 0
      && product.tags.indexOf(PRODUCT_TAG_FREEZYBOY) !== -1) {
      return true;
    }
    return false;
  }

  async calculate() {
    const {
      user,
      quantity,
      currency,
    } = this.context;

    if (user && user.tags) {
      const { tags } = user.profile;
      if (tags.indexOf(USER_TAG_STUDIO) !== -1 || tags.indexOf(USER_TAG_PARTNER) !== -1) {
        // skip for studios and partners
        return super.calculate();
      }
    }

    if (moment().isBefore('2018-05-01', 'day')) {
      // einführungsrabatt
      const item = {
        currency,
        amount: staticPrices[currency][USER_TAG_CONSUMER] * quantity,
        isTaxable: true,
        isNetPrice: false,
        meta: { adapter: this.constructor.key },
      };
      this.resetCalculation();
      this.result.addItem(item);
    }

    // user pricing
    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(FreezyboyPrice);
