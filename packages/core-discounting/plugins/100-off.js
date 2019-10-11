import {
  DiscountDirector,
  DiscountAdapter
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

  // return true if a discount is valid to be part of the order.
  // if you return false, this discount will
  // get removed from the order before any price calculation
  // takes place.
  // if you return false and the trigger is system,
  // the coupon does not get automatically added
  isValid(isTriggerSystem, code) { // eslint-disable-line
    if (!isTriggerSystem && code === '100OFF') {
      return true;
    }
    return false;
  }

  // returns the appropriate discount context for a calculation adapter
  discountForPricingAdapterKey(pricingAdapterKey, code) { // eslint-disable-line
    if (pricingAdapterKey === 'shop.unchained.pricing.order-discount') {
      return { fixedRate: 10000 };
    }
    return null;
  }
}

DiscountDirector.registerAdapter(HundredOff);
