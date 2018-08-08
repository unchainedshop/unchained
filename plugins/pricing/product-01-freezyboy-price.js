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
staticPrices[CURRENCY_CHF][USER_TAG_STUDIO] = 70000;
staticPrices[CURRENCY_CHF][USER_TAG_PARTNER] = 52500;
staticPrices[CURRENCY_CHF][USER_TAG_CONSUMER] = 79000; // incl. mwst

class FreezyboyPrice extends ProductPricingAdapter {
  static key = 'ch.freezyboy.pricing'

  static version = '1.0'

  static label = 'Berechnung der Bestellposition: Preis'

  static orderIndex = 1

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
      const item = {
        currency,
        amount: 0,
        isTaxable: true,
        isNetPrice: true,
        meta: { adapter: this.constructor.key },
      };
      if (tags.indexOf(USER_TAG_STUDIO) !== -1) {
        this.log(`FreezyboyPrice -> Overwrite Default Price: ${USER_TAG_STUDIO} ${staticPrices[item.currency][USER_TAG_STUDIO]} x ${quantity}`);
        item.amount = staticPrices[item.currency][USER_TAG_STUDIO] * quantity;
      }
      if (tags.indexOf(USER_TAG_PARTNER) !== -1) {
        this.log(`FreezyboyPrice -> Overwrite Default Price: ${USER_TAG_PARTNER} ${staticPrices[item.currency][USER_TAG_PARTNER]} x ${quantity}`);
        item.amount = staticPrices[item.currency][USER_TAG_PARTNER] * quantity;
      }

      if (item.amount > 0) {
        this.calculation.filterBy().forEach(({ amount, ...row }) => {
          // revert old prices
          this.result.calculation.push({
            ...row,
            amount: amount * -1,
          });
        });

        // studio pricing
        this.result.addItem(item);
      }
    }
    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(FreezyboyPrice);
