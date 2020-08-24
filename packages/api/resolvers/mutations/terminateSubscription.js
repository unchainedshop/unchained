import { log } from 'meteor/unchained:core-logger';
import {
  Subscriptions,
  SubscriptionStatus,
} from 'meteor/unchained:core-subscriptions';
import {
  SubscriptionNotFoundError,
  SubscriptionWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default async function terminateSubscription(
  root,
  { subscriptionId },
  { userId },
) {
  log('mutation terminateSubscription', { userId });
  if (!subscriptionId) throw new InvalidIdError({ subscriptionId });
  const subscription = Subscriptions.findOne({
    _id: subscriptionId,
  });
  if (!subscription) {
    throw new SubscriptionNotFoundError({
      subscriptionId,
    });
  }
  if (subscription.status === SubscriptionStatus.TERMINATED) {
    throw new SubscriptionWrongStatusError({ status: subscription.status });
  }
  return subscription.terminate();
}
