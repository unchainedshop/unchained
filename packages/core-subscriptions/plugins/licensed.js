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

  async isValidForActivation() {
    console.log(this);
    return true;
  }

  async isOverdue() {
    console.log(this);
    return false;
  }
}

SubscriptionDirector.registerAdapter(LicensedSubscriptions);
