import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';

export default function subscription(root, { limit, offset }, { userId }) {
  log(`query subscriptions: ${limit} ${offset}`, { userId });
  return Subscriptions.findSubscriptions({ limit, offset });
}
