import moment from 'moment';
import { DiscountDirector, DiscountAdapter } from 'meteor/unchained:core-discounting';

class KitchenStudios extends DiscountAdapter {
  static key = 'ch.freezyboy.christmas'

  static label = 'Christmas Discount'

  static version = '1.0'

  static orderIndex = 4

  // return true if a discount is allowed to get added manually by a user
  static isManualAdditionAllowed() { // eslint-disable-line
    return false;
  }

  // return true if a discount is allowed to get removed manually by a user
  static isManualRemovalAllowed() { // eslint-disable-line
    return false;
  }

  // return true if a discount is valid to be part of the order.
  // if you return false, this discount will
  // get removed from the order before any price calculation
  // takes place.
  // if you return false and the trigger is system,
  // the coupon does not get automatically added
  isValid(isTriggerSystem) { // eslint-disable-line
    const { order } = this.context;
    const user = order.user();
    const isUserStudio = (user
&& user.tags && user.tags.indexOf('studio') !== -1);
    const isUserPartner = (user
&& user.tags && user.tags.indexOf('partner') !== -1);
    const isBeforeChristmas = moment().isBefore('2017-12-26', 'day');
    if (isTriggerSystem && (!isUserStudio && !isUserPartner) && isBeforeChristmas) {
      return true;
    }
    return false;
  }

  // returns the appropriate discount context for a calculation adapter
  discountForPricingAdapterKey(pricingAdapterKey) { // eslint-disable-line
    if (pricingAdapterKey === 'shop.unchained.pricing.order-discount') {
      return { rate: 0.1 };
    }
    return null;
  }
}

DiscountDirector.registerAdapter(KitchenStudios);
