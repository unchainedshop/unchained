import {
  SubscriptionDirector,
  SubscriptionAdapter,
} from 'meteor/unchained:core-subscriptions';

class LicensedSubscriptions extends SubscriptionAdapter {
  static key = 'shop.unchained.subscriptions.licensed';

  static version = '1.0';

  static label = 'Simple Licensed Subscriptions';

  static orderIndex = 0;

  async generateSubscriptionsForOrder() { // eslint-disable-line
    return [];
  }
}

SubscriptionDirector.registerAdapter(LicensedSubscriptions);
