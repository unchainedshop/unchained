import { log } from 'meteor/unchained:core-logger';
import {
  Subscriptions,
  SubscriptionStatus,
} from 'meteor/unchained:core-subscriptions';
import {
  SubscriptionNotFoundError,
  SubscriptionWrongStatusError,
} from '../../errors';

export default async function (root, { subscriptionId }, { userId }) {
  log('mutation activateSubscription', { userId });
  if (!subscriptionId) {
    throw new Error('Invalid value provided for subscription ID');
  }
  const subscription = Subscriptions.findOne({
    _id: subscriptionId,
  });
  if (!subscription) {
    throw new SubscriptionNotFoundError({
      subscriptionId,
    });
  }
  if (
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TERMINATED
  ) {
    throw new SubscriptionWrongStatusError({ status: subscription.status });
  }
  return subscription.activate();
}
