import {
  DiscountDirector,
  DiscountAdapter
} from 'meteor/unchained:core-discounting';

class HalfPriceManual extends DiscountAdapter {
  static key = 'shop.unchained.discount.half-price-manual';

  static label = 'Half Price';

  static version = '1.0';

  static orderIndex = 2;

  // return true if a discount is allowed to get added manually by a user
  static isManualAdditionAllowed() { // eslint-disable-line
    return true;
  }

  // return true if a discount is allowed to get removed manually by a user
  static isManualRemovalAllowed() { // eslint-disable-line
    return true;
  }

  async isValidForSystemTriggering() { // eslint-disable-line
    return false;
  }

  async isValidForCodeTriggering({ code }) { // eslint-disable-line
    return (code === 'HALFPRICE')
  }

  // returns the appropriate discount context for a calculation adapter
  discountForPricingAdapterKey({ pricingAdapterKey }) { // eslint-disable-line
    if (pricingAdapterKey === 'shop.unchained.pricing.product-discount') {
      return { rate: 0.5 };
    }
    return null;
  }
}

DiscountDirector.registerAdapter(HalfPriceManual);
