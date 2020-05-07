import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';

export default function (root, { limit, offset }, { userId }) {
  log(`query subscriptions: ${limit} ${offset}`, { userId });
  const selector = {};
  const subscriptions = Subscriptions.find(selector, {
    skip: offset,
    limit,
  }).fetch();
  return subscriptions;
}
