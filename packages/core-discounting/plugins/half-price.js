import {
  DiscountDirector,
  DiscountAdapter,
} from 'meteor/unchained:core-discounting';

class HalfPrice extends DiscountAdapter {
  static key = 'shop.unchained.discount.half-price';

  static label = 'Half Price';

  static version = '1.0';

  static orderIndex = 3;

  // return true if a discount is allowed to get added manually by a user
  static isManualAdditionAllowed() { // eslint-disable-line
    return false;
  }

  // return true if a discount is allowed to get removed manually by a user
  static isManualRemovalAllowed() { // eslint-disable-line
    return false;
  }

  async isValidForSystemTriggering() { // eslint-disable-line
    const { order } = this.context;
    const user = order.user();
    const isUserEligibleForHalfPrice =
      user && user.tags && user.tags.indexOf('half-price') !== -1;
    return !!isUserEligibleForHalfPrice;
  }

  async isValidForCodeTriggering({ code }) { // eslint-disable-line
    return false;
  }

  // returns the appropriate discount context for a calculation adapter
  discountForPricingAdapterKey({ pricingAdapterKey }) { // eslint-disable-line
    if (pricingAdapterKey === 'shop.unchained.pricing.product-discount') {
      return { rate: 0.5 };
    }
    return null;
  }
}

DiscountDirector.registerAdapter(HalfPrice);
