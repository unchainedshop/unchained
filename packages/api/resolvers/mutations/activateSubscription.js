import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';
import { ProductStatus } from 'meteor/unchained:core-products';
import {
  SubscriptionNotFoundError,
  SubscriptionWrongStatusError,
} from '../../errors';

export default async function (root, { subscriptionId }, { userId }) {
  log('mutation activateSubscription', { userId });
  const subscription = Subscriptions.findOne({
    _id: subscriptionId,
  });
  if (!subscription) {
    throw new SubscriptionNotFoundError({
      subscriptionId,
    });
  }
  if (
    subscription.status === ProductStatus.ACTIVE ||
    subscription.status === ProductStatus.TERMINATED
  ) {
    throw new SubscriptionWrongStatusError({ status: subscription.status });
  }
  return subscription.activate();
}
