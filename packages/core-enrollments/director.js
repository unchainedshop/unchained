import { log } from 'meteor/unchained:logger';
import moment from 'moment';

const EnrollmentError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
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

class EnrollmentAdapter {
  static key = '';

  static label = '';

  static version = '';

  // eslint-disable-next-line
  static isActivatedFor({ usageCalculationType }) {
    return false;
  }

  static async transformOrderItemToEnrollment(item, context) {
    // eslint-disable-line
    return {
      quantity: item.quantity,
      configuration: item.configuration,
      productId: item.productId,
    };
  }

  async nextPeriod() {
    const { enrollment } = this.context;
    const plan = enrollment?.product()?.plan;
    const referenceDate = new Date();
    if (!plan) return null;

    if (plan.trialIntervalCount && !enrollment?.periods?.length) {
      return {
        ...periodForReferenceDate(
          referenceDate,
          plan.trialIntervalCount,
          plan.trialInterval
        ),
        isTrial: true,
      };
    }

    const lastEnd = enrollment?.periods?.reduce((acc, item) => {
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
    throw new Error(`Not implemented on ${this.constructor.key}`);
  }

  constructor(context) {
    this.context = context;
  }

  // eslint-disable-next-line
  log(message, { level = 'debug', ...options } = {}) {
    return log(message, { level, ...options });
  }
}

class EnrollmentDirector {
  constructor(enrollment) {
    this.context = {
      enrollment,
    };
  }

  resolveAdapter(context) {
    const { enrollment } = this.context;
    const Adapter = this.constructor.findAppropriateAdapters(
      enrollment.product()?.plan
    )?.[0];
    if (!Adapter) {
      throw new Error(
        'No suitable enrollment plugin available for this plan configuration'
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

  static adapters = new Map();

  static filteredAdapters(filter) {
    return Array.from(EnrollmentDirector.adapters)
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

  static async transformOrderItemToEnrollment(item, enrollmentData) {
    const product = item.product();
    const AdapterClass = this.findAppropriateAdapters(product.plan)?.[0];
    if (!AdapterClass) {
      throw new Error('No suitable enrollment plugin available for this item');
    }
    const transformedItem = await AdapterClass.transformOrderItemToEnrollment(
      item
    );
    return {
      ...enrollmentData,
      ...transformedItem,
    };
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    ); // eslint-disable-line
    EnrollmentDirector.adapters.set(adapter.key, adapter);
  }
}

export { EnrollmentDirector, EnrollmentAdapter, EnrollmentError };
