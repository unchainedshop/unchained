import { log } from 'meteor/unchained:core-logger';

class DiscountAdapter {
  static key = '';

  static label = '';

  static version = '';

  static orderIndex = -1;

  // return true if a discount is allowed to get added manually by a user
  static isManualAdditionAllowed(code) { // eslint-disable-line
    return false;
  }

  // return true if a discount is allowed to get removed manually by a user
  static isManualRemovalAllowed() { // eslint-disable-line
    return false;
  }

  constructor({ context }) {
    // trigger, code, order
    this.context = context;
  }

  // return true if a discount is valid to be part of the order.
  // if you return false, this discount will
  // get removed from the order before any price calculation
  // takes place.
  // if you return false and the trigger is system,
  // the coupon does not get automatically added
  isValid(isTriggerSystem, code) { // eslint-disable-line
    return !isTriggerSystem;
  }

  // returns the appropriate discount context for a calculation adapter
  discountForPricingAdapterKey(pricingAdapterKey, code) { // eslint-disable-line
    return null;
  }

  log(message, { level = 'debug', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class DiscountDirector {
  constructor(context) {
    this.context = context;
  }

  interfaceClass(discountKey) { // eslint-disable-line
    return DiscountDirector.adapters.get(discountKey);
  }

  isValid({ discountKey, code, isTriggerSystem }) { // eslint-disable-line
    const AdapterClass = this.interfaceClass(discountKey);
    if (!AdapterClass) return false;
    const adapter = new AdapterClass({ context: this.context });
    return adapter.isValid(isTriggerSystem, code);
  }

  discountConfigurationForCalculation({ discountKey, code, pricingAdapterKey }) { // eslint-disable-line
    const AdapterClass = this.interfaceClass(discountKey);
    if (!AdapterClass) return null;
    const adapter = new AdapterClass({ context: this.context });
    return adapter.discountForPricingAdapterKey(pricingAdapterKey, code);
  }

  resolveDiscountKeyFromStaticCode({ code }) {
    if (!this.context.order) return [];
    log(`DiscountDirector -> Find user discount for static code ${code}`);
    const discountKeys = DiscountDirector.sortedAdapters()
      .filter(AdapterClass => AdapterClass.isManualAdditionAllowed(code))
      .map(AdapterClass => new AdapterClass({ context: this.context }))
      .filter(adapter => adapter.isValid(false, code))
      .map(adapter => adapter.constructor.key);
    return discountKeys.length > 0 && discountKeys[0];
  }

  findSystemDiscounts() {
    if (!this.context.order) return [];
    log('DiscountDirector -> Find system discounts');
    const discountKeys = DiscountDirector.sortedAdapters()
      .map(AdapterClass => new AdapterClass({ context: this.context }))
      .filter(adapter => adapter.isValid(true))
      .map(adapter => adapter.constructor.key);
    return discountKeys;
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(DiscountDirector.adapters)
      .map(entry => entry[1])
      .sort((left, right) => left.orderIndex > right.orderIndex);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    DiscountDirector.adapters.set(adapter.key, adapter);
  }
}

export { DiscountDirector, DiscountAdapter };
