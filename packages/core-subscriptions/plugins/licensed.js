import {
  SubscriptionDirector,
  SubscriptionAdapter,
} from 'meteor/unchained:core-subscriptions';

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
    return true;
  }

  // eslint-disable-next-line
  async isOverdue() {
    return false;
  }

  async shouldTriggerAction({ period, action }) {
    return true;
  }
}

SubscriptionDirector.registerAdapter(LicensedSubscriptions);
