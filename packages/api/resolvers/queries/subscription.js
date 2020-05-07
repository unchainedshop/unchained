import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';

export default function (root, { subscriptionId }, { userId }) {
  log(`query subscription ${subscriptionId}`, { userId, subscriptionId });
  const selector = { _id: subscriptionId };
  return Subscriptions.findOne(selector);
}
