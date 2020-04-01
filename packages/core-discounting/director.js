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

  // return true if a discount is valid to be part of the order
  // without input of a user. that could be a time based global discount
  // like a 10% discount day
  // if you return false, this discount will
  // get removed from the order before any price calculation
  // takes place.
  // eslint-disable-next-line
  async isValidForSystemTriggering(options) {
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
  discountForPricingAdapterKey({ pricingAdapterKey }) { // eslint-disable-line
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

  interface(discountKey) {
    const AdapterClass = this.interfaceClass(discountKey);
    if (!AdapterClass) return null;
    const adapter = new AdapterClass({ context: this.context });
    return adapter;
  }

  async resolveDiscountKeyFromStaticCode(options) {
    if (!this.context.order) return [];
    log(
      `DiscountDirector -> Find user discount for static code ${options?.code}`
    );
    const discounts = await Promise.all(
      DiscountDirector.sortedAdapters()
        .filter((AdapterClass) =>
          AdapterClass.isManualAdditionAllowed(options?.code)
        )
        .map(async (AdapterClass) => {
          const adapter = new AdapterClass({ context: this.context });
          return {
            key: AdapterClass.key,
            isValid: await adapter.isValidForCodeTriggering(options),
          };
        })
    );

    return discounts.find(({ isValid }) => isValid === true)?.key;
  }

  async findSystemDiscounts(options) {
    if (!this.context.order) return [];
    const discounts = await Promise.all(
      DiscountDirector.sortedAdapters().map(async (AdapterClass) => {
        const adapter = new AdapterClass({ context: this.context });
        return {
          key: AdapterClass.key,
          isValid: await adapter.isValidForSystemTriggering(options),
        };
      })
    );
    const validDiscounts = discounts
      .filter(({ isValid }) => isValid === true)
      .map(({ key }) => key);
    if (validDiscounts.length > 0) {
      log(
        `DiscountDirector -> Found ${validDiscounts.length} system discounts`
      );
    }
    return validDiscounts;
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(DiscountDirector.adapters)
      .map((entry) => entry[1])
      .sort((left, right) => left.orderIndex - right.orderIndex);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    DiscountDirector.adapters.set(adapter.key, adapter);
  }
}

export { DiscountDirector, DiscountAdapter };
