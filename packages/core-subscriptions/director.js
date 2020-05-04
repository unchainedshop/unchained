import { log } from 'meteor/unchained:core-logger';
import moment from 'moment';

const SubscriptionError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
};

export const SubscriptionActions = {
  GENERATE_ORDER: 'GENERATE_ORDER',
};

const periodForReferenceDate = (
  referenceDate,
  intervalCount = 1,
  interval = 'WEEK'
) => {
  const start = moment(referenceDate).startOf(
    interval === 'HOUR' ? 'minute' : 'hour'
  );
  return {
    start: start.toDate(),
    end: start.add(intervalCount, interval).toDate(),
  };
};

class SubscriptionAdapter {
  static key = '';

  static label = '';

  static version = '';

  static isActivatedFor({ usageCalculationType }) {  // eslint-disable-line
    return false;
  }

  static async transformOrderItemToSubscription(item, context) { // eslint-disable-line
    return {
      quantity: item.quantity,
      configuration: item.configuration,
      productId: item.productId,
    };
  }

  async nextPeriod() {
    const { subscription } = this.context;
    const plan = subscription?.product()?.plan;
    const referenceDate = new Date();
    if (!plan) return null;

    if (plan.trialIntervalCount && !subscription?.periods?.length) {
      return {
        ...periodForReferenceDate(
          referenceDate,
          plan.trialIntervalCount,
          plan.trialInterval
        ),
        isTrial: true,
      };
    }

    const lastEnd = subscription?.periods?.reduce((acc, item) => {
      if (!acc) return item.end;
      const endDate = new Date(item.end);
      if (acc.getTime() < endDate.getTime()) {
        return endDate;
      }
      return acc;
    }, referenceDate);
    return {
      ...periodForReferenceDate(
        lastEnd,
        plan.billingIntervalCount,
        plan.billingInterval
      ),
      isTrial: false,
    };
  }

  // eslint-disable-next-line
  async shouldTriggerAction({ period, action }) {
    throw new Error(`Not implemented on ${this.constructor.key}`);
  }

  // eslint-disable-next-line
  async configurationForOrder(context) {
    return {
      context,
    };
  }

  constructor(context) {
    this.context = context;
  }

  log(message, { level = 'debug', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class SubscriptionDirector {
  constructor(subscription) {
    this.context = {
      subscription,
    };
  }

  resolveAdapter(context) {
    const { subscription } = this.context;
    const Adapter = this.constructor.findAppropriateAdapters(
      subscription.product()?.plan
    )?.[0];
    if (!Adapter) {
      throw new Error(
        'No suitable subscription plugin available for this plan configuration'
      );
    }
    const adapter = new Adapter({
      ...this.context,
      ...context,
    });
    return adapter;
  }

  async isValidForActivation(context) {
    const adapter = this.resolveAdapter();
    return adapter.isValidForActivation(context);
  }

  async isOverdue(context) {
    const adapter = this.resolveAdapter(context);
    return adapter.isOverdue(context);
  }

  async nextPeriod(context) {
    const adapter = this.resolveAdapter();
    return adapter.nextPeriod(context);
  }

  async shouldTriggerAction(context) {
    const adapter = this.resolveAdapter();
    return adapter.shouldTriggerAction(context);
  }

  async configurationForOrder(context) {
    const adapter = this.resolveAdapter();
    return adapter.configurationForOrder(context);
  }

  async orderConfigurationForPeriod(period, context) {
    const isNewOrderRequired = await this.shouldTriggerAction({
      ...context,
      period,
      action: SubscriptionActions.GENERATE_ORDER,
    });
    if (isNewOrderRequired) {
      return this.configurationForOrder({
        ...context,
        period,
      });
    }
    return null;
  }

  static adapters = new Map();

  static filteredAdapters(filter) {
    return Array.from(SubscriptionDirector.adapters)
      .map(([, entry]) => entry)
      .filter(filter || (() => true));
  }

  static findAppropriateAdapters(context) {
    return this.filteredAdapters((AdapterClass) => {
      const activated = AdapterClass.isActivatedFor({
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

  static async transformOrderItemToSubscription(item, subscriptionData) {
    const product = item.product();
    const AdapterClass = this.findAppropriateAdapters(product.plan)?.[0];
    if (!AdapterClass) {
      throw new Error(
        'No suitable subscription plugin available for this item'
      );
    }
    const transformedItem = await AdapterClass.transformOrderItemToSubscription(
      item
    );
    return {
      ...subscriptionData,
      ...transformedItem,
    };
  }

  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`) // eslint-disable-line
    SubscriptionDirector.adapters.set(adapter.key, adapter);
  }
}

export { SubscriptionDirector, SubscriptionAdapter, SubscriptionError };
