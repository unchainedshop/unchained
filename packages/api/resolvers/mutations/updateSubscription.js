import { log } from 'meteor/unchained:core-logger';
import {
  Subscriptions,
  SubscriptionStatus,
} from 'meteor/unchained:core-subscriptions';
import {
  SubscriptionNotFoundError,
  SubscriptionWrongStatusError,
} from '../../errors';

export default async function (
  root,
  { subscriptionId, contact, plan, billingAddress, payment, delivery, meta },
  { userId },
) {
  log('mutation updateSubscription', { userId });
  let subscription = Subscriptions.findOne({
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
  if (meta) {
    subscription = subscription.updateContext(meta);
  }
  if (billingAddress) {
    subscription = subscription.updateBillingAddress(billingAddress);
  }
  if (contact) {
    subscription = subscription.updateContact(contact);
  }
  if (payment) {
    subscription = subscription.updatePayment(payment);
  }
  if (delivery) {
    subscription = subscription.updateDelivery(delivery);
  }
  if (plan) {
    subscription = subscription.updatePlan(plan);
  }
  return subscription;
}
