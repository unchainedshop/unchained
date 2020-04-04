import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';
import { UserNotFoundError } from '../../errors';

export default function (
  root,
  { contact, plans, billingAddress, payment, delivery, meta },
  { countryContext, userId, user }
) {
  log('mutation createSubscription', { userId });
  if (!user) throw new UserNotFoundError({ userId });
  return Subscriptions.createSubscription({
    plans,
    userId,
    countryCode: countryContext,
    payment,
    delivery,
    contact,
    billingAddress,
    meta,
  });
}
