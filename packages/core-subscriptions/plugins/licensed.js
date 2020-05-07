import {
  SubscriptionDirector,
  SubscriptionAdapter,
} from 'meteor/unchained:core-subscriptions';

const rangeMatcher = (date = new Date()) => {
  const timestamp = date.getTime();
  return ({ start, end }) => {
    const startTimestamp = new Date(start).getTime();
    const endTimestamp = new Date(end).getTime();
    return startTimestamp <= timestamp && endTimestamp >= timestamp;
  };
};

class LicensedSubscriptions extends SubscriptionAdapter {
  static key = 'shop.unchained.subscriptions.licensed';

  static version = '1.0';

  static label = 'Simple Licensed Subscriptions';

  static orderIndex = 0;

  static isActivatedFor({ usageCalculationType, ...plan }) {  // eslint-disable-line
    return usageCalculationType === 'LICENSED';
  }

  // eslint-disable-next-line
  async isValidForActivation() {
    const periods = this.context?.subscription?.periods || [];
    const inRange = periods.find(rangeMatcher());
    return inRange;
  }

  // eslint-disable-next-line
  async isOverdue() {
    return false;
  }

  // eslint-disable-next-line
  async configurationForOrder(context) {
    const { period } = context;
    const beginningOfPeriod = period.start.getTime() <= new Date().getTime();
    if (beginningOfPeriod) {
      return {
        context,
      };
    }
    return null;
  }
}

SubscriptionDirector.registerAdapter(LicensedSubscriptions);
