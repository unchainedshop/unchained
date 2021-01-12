import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';
import { SubscriptionNotFoundError, InvalidIdError } from '../../errors';

export default function subscription(root, { subscriptionId }, { userId }) {
  log(`query subscription ${subscriptionId}`, { userId, subscriptionId });
  if (!subscriptionId) throw new InvalidIdError({ subscriptionId });
  const foundSubscription = Subscriptions.findSubscription({ subscriptionId });
  if (!foundSubscription)
    throw new SubscriptionNotFoundError({ subscriptionId });
  return foundSubscription;
}
