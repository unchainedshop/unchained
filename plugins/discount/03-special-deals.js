import { DiscountDirector, DiscountAdapter } from 'meteor/unchained:core-discounting';

const CODE = 'FREEZE83L!704NOW';

class SpecialDeals extends DiscountAdapter {
  static key = 'ch.freezyboy.specialdeals'
  static label = 'Special Deals Discount'
  static version = '1.0'
  static orderIndex = 3

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
  isValid(isTriggerSystem, code = '') { // eslint-disable-line
    if (code.toUpperCase() !== CODE) {
      return false;
    }
    const { order } = this.context;
    const user = order.user();
    const isUserStudio = (user && user.profile && user.profile.tags && user.profile.tags.indexOf('studio') !== -1);
    const isUserPartner = (user && user.profile && user.profile.tags && user.profile.tags.indexOf('partner') !== -1);
    if (!isTriggerSystem && (!isUserStudio && !isUserPartner)) {
      return true;
    }
    return false;
  }

  // returns the appropriate discount context for a calculation adapter
  discountForPricingAdapterKey(pricingAdapterKey) { // eslint-disable-line
    if (pricingAdapterKey === 'ch.dagobert.pricing.order-discount') {
      return { rate: 0.2 };
    }
    return null;
  }
}

DiscountDirector.registerAdapter(SpecialDeals);
