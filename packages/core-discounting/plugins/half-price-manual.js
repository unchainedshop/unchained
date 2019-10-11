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

  // return true if a discount is valid to be part of the order.
  // if you return false, this discount will
  // get removed from the order before any price calculation
  // takes place.
  // if you return false and the trigger is system,
  // the coupon does not get automatically added
  isValid(isTriggerSystem, code) { // eslint-disable-line
    if (!isTriggerSystem && code === 'HALFPRICE') {
      return true;
    }
    return false;
  }

  // returns the appropriate discount context for a calculation adapter
  discountForPricingAdapterKey(pricingAdapterKey, code) { // eslint-disable-line
    if (pricingAdapterKey === 'shop.unchained.pricing.product-discount') {
      return { rate: 0.5 };
    }
    return null;
  }
}

DiscountDirector.registerAdapter(HalfPriceManual);
