import { log } from 'meteor/unchained:core-logger';

const SubscriptionError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
};

class SubscriptionAdapter {
  static key = '';

  static label = '';

  static version = '';

  static isActivatedFor(usageCalculationType) {  // eslint-disable-line
    return false;
  }

  constructor(context) {
    this.context = context;
  }

  async generateSubscriptionsForOrder() { // eslint-disable-line
    return [];
  }

  log(message, { level = 'debug', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class SubscriptionDirector {
  constructor(order) {
    this.context = {
      order,
    };
  }

  findAppropriateAdapters(context) {
    return this.constructor.filteredAdapters((AdapterClass) => {
      const activated = AdapterClass.isActivatedFor({
        ...this.context,
        ...context,
      });
      if (!activated) {
        log(
          `${this.constructor.name} -> ${AdapterClass.key} (${AdapterClass.version}) skipped`,
          {
            level: 'warn',
          }
        );
      }
      return activated;
    });
  }

  async generateSubscriptionsForOrder(context, options) {
    const AdapterTypes = this.findAppropriateAdapters(context);
    if (AdapterTypes.length === 0) {
      throw new Error(
        'No suitable subscription plugin available for this order'
      );
    }
    const subscriptions = await Promise.all(
      AdapterTypes.map(async (Adapter) => {
        const adapter = new Adapter({
          ...this.context,
          ...context,
        });
        return adapter.subscriptionsForPlanItems(options);
      })
    );
    return subscriptions.flat();
  }

  async isReadyForActivation() {
    return true;
  }

  async isOverdue() {
    return false;
  }

  static adapters = new Map();

  static filteredAdapters(filter) {
    return Array.from(SubscriptionDirector.adapters)
      .map(([, entry]) => entry)
      .filter(filter || (() => true));
  }

  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`) // eslint-disable-line
    SubscriptionDirector.adapters.set(adapter.key, adapter);
  }
}

export { SubscriptionDirector, SubscriptionAdapter, SubscriptionError };
