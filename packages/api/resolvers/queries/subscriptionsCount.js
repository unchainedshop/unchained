import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';

export default function subscriptionsCount(root, _, { userId }) {
  log(`query subscriptionsCount`, { userId });
  return Subscriptions.count();
}
