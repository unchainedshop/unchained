import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';
import { ProductStatus } from 'meteor/unchained:core-products';
import {
  SubscriptionNotFoundError,
  SubscriptionWrongStatusError,
} from '../../errors';

export default async function (
  root,
  { subscriptionId, contact, plan, billingAddress, payment, delivery, meta },
  { userId }
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
  if (subscription.status === ProductStatus.TERMINATED) {
    throw new SubscriptionWrongStatusError({ status: subscription.status });
  }
  if (meta) {
    subscription = subscription.updateContext(meta);
  }
  if (billingAddress) {
    subscription = subscription.updateBillingAddress(billingAddress);
  }
  if (contact) {
    subscription = subscription.updateContact({ contact });
  }
  // if (plan) {
  //
  // }
  // if (payment) {
  //   subscription = subscription.setPaymentProvider({ paymentProviderId });
  // }
  // if (delivery) {
  //   subscription = subscription.setDeliveryProvider({ deliveryProviderId });
  // }
  return subscription;
}
