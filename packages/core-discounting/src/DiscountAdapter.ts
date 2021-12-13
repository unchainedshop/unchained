import { log, LogLevel } from 'meteor/unchained:logger';

import { DiscountContext, DiscountAdapter as IDiscountAdapter } from '@unchainedshop/types/discounting'

export class DiscountAdapter implements IDiscountAdapter {
  static key = '';

  static label = '';

  static version = '';

  static orderIndex = -1;

  // return true if a discount is allowed to get added manually by a user
  static isManualAdditionAllowed(code: string) {
    // eslint-disable-line
    return false;
  }

  // return true if a discount is allowed to get removed manually by a user
  static isManualRemovalAllowed() {
    // eslint-disable-line
    return false;
  }

  public context: DiscountContext;

  constructor({ context }: { context: DiscountContext }) {
    // trigger, code, order
    this.context = context;
  }

  // return true if a discount is valid to be part of the order
  // without input of a user. that could be a time based global discount
  // like a 10% discount day
  // if you return false, this discount will
  // get removed from the order before any price calculation
  // takes place.
  // eslint-disable-next-line
  async isValidForSystemTriggering() {
    return false;
  }

  // return an arbitrary JSON serializable object with reservation data
  // this method is called when a discount is added through a manual code and let's
  // you manually deduct expendable discounts (coupon balances for ex.) before checkout
  // eslint-disable-next-line
  async reserve() {
    return {};
  }

  // return void, allows you to free up any reservations in backend systems
  // eslint-disable-next-line
  async release() {}

  // return true if a discount is valid to be part of the order.
  // if you return false, this discount will
  // get removed from the order before any price calculation
  // takes place.
  // eslint-disable-next-line
  async isValidForCodeTriggering(options) {
    return false;
  }

  // returns the appropriate discount context for a calculation adapter
  discountForPricingAdapterKey(params: { pricingAdapterKey: string }) {
    // eslint-disable-line
    return null;
  }

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    // eslint-disable-line
    return log(message, { level, ...options });
  }
}
