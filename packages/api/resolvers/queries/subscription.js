import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';
import { SubscriptionNotFoundError } from '../../errors';

export default function (root, { subscriptionId }, { userId }) {
  log(`query subscription ${subscriptionId}`, { userId, subscriptionId });

  if (!subscriptionId) throw new Error('Invalid subscription ID provided');

  const selector = { _id: subscriptionId };
  const subscription = Subscriptions.findOne(selector);

  if (subscription) throw new SubscriptionNotFoundError({ subscriptionId });

  return subscription;
}
