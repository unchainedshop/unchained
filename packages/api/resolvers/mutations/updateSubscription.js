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

export default async function updateSubscription(
  root,
  { subscriptionId, contact, plan, billingAddress, payment, delivery, meta },
  { userId }
) {
  log('mutation updateSubscription', { userId });
  if (!subscriptionId) throw new InvalidIdError({ subscriptionId });
  const subscription = Subscriptions.findSubscription({ subscriptionId });
  if (!subscription) {
    throw new SubscriptionNotFoundError({
      subscriptionId,
    });
  }
  if (subscription.status === SubscriptionStatus.TERMINATED) {
    throw new SubscriptionWrongStatusError({ status: subscription.status });
  }
  if (meta) {
    Subscriptions.updateContext({ meta, subscriptionId });
  }
  if (billingAddress) {
    Subscriptions.updateBillingAddress({ billingAddress, subscriptionId });
  }
  if (contact) {
    Subscriptions.updateContact({ contact, subscriptionId });
  }
  if (payment) {
    Subscriptions.updatePayment({ payment, subscriptionId });
  }
  if (delivery) {
    Subscriptions.updateDelivery({ delivery, subscriptionId });
  }
  if (plan) {
    if (subscription.status !== SubscriptionStatus.INITIAL) {
      // If Subscription is not initial, forcefully add a new Period that OVERLAPS the existing periods
      throw new Error(
        'TODO: Unchained currently does not support order splitting for subscriptions, therefore updates to quantity, product and configuration of a subscription is forbidden for non initial subscriptions'
      );
    }
    await Subscriptions.updatePlan({ plan, subscriptionId });
  }
  return Subscriptions.findSubscription({ subscriptionId });
}
