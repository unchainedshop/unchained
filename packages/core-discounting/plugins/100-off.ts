import {
  DiscountDirector,
  DiscountAdapter,
} from 'meteor/unchained:core-discounting';

class HundredOff extends DiscountAdapter {
  static key = 'shop.unchained.discount.100-off';

  static label = '100 Off';

  static version = '1.0';

  static orderIndex = 1;

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
    return code.toUpperCase() === '100OFF';
  }

  // returns the appropriate discount context for a calculation adapter
  discountForPricingAdapterKey({ pricingAdapterKey }) { // eslint-disable-line
    if (pricingAdapterKey === 'shop.unchained.pricing.order-discount') {
      return { fixedRate: 10000 };
    }
    return null;
  }
}

DiscountDirector.registerAdapter(HundredOff);
