import Hashids from 'hashids/cjs';
import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { objectInvert } from 'meteor/unchained:utils';
import { Users } from 'meteor/unchained:core-users';
import { Products } from 'meteor/unchained:core-products';
import { Countries } from 'meteor/unchained:core-countries';
import { Currencies } from 'meteor/unchained:core-currencies';
import { Logs, log } from 'meteor/unchained:core-logger';
import {
  MessagingDirector,
  MessagingType,
} from 'meteor/unchained:core-messaging';
import { Subscriptions } from './collections';
import { SubscriptionStatus } from './schema';
import { SubscriptionDirector } from '../../director';

const { EMAIL_FROM, UI_ENDPOINT } = process.env;

Logs.helpers({
  subscription() {
    return (
      this.meta &&
      Subscriptions.findOne({
        _id: this.meta.subscriptionId,
      })
    );
  },
});

Users.helpers({
  subscriptions() {
    return Subscriptions.find(
      { userId: this._id },
      {
        sort: {
          created: -1,
        },
      }
    ).fetch();
  },
});

Subscriptions.helpers({
  user() {
    return Users.findOne({
      _id: this.userId,
    });
  },
  product() {
    return Products.findOne({
      _id: this.productId,
    });
  },
  country() {
    return Countries.findOne({ isoCode: this.countryCode });
  },
  currency() {
    return Currencies.findOne({ isoCode: this.currencyCode });
  },
  normalizedStatus() {
    return objectInvert(SubscriptionStatus)[this.status || null];
  },
  updateContext(context) {
    return Subscriptions.updateContext({
      subscriptionId: this._id,
      context,
    });
  },
  terminate({ subscriptionContext } = {}, options) {
    if (this.status === SubscriptionStatus.TERMINATED) return this;
    return this.setStatus(SubscriptionStatus.TERMINATED, 'terminated manually')
      .process({ subscriptionContext })
      .sendStatusToCustomer(options);
  },
  activate({ subscriptionContext } = {}, options) {
    if (this.status === SubscriptionStatus.TERMINATED) return this;
    return this.setStatus(SubscriptionStatus.ACTIVE, 'activated manually')
      .process({ subscriptionContext })
      .sendStatusToCustomer(options);
  },
  sendStatusToCustomer(options) {
    const user = this.user();
    const locale = user.locale(options).normalized;
    const director = new MessagingDirector({
      locale,
      subscription: this,
      type: MessagingType.EMAIL,
    });
    director.sendMessage({
      template: 'shop.unchained.subscriptions.status',
      meta: {
        mailPrefix: `${this.subscriptionNumber}_`,
        from: EMAIL_FROM,
        to: user.primaryEmail()?.address,
        url: `${UI_ENDPOINT}/subscription?_id=${this._id}&otp=${this.subscriptionNumber}`,
        subscription: this,
      },
    });
    return this;
  },
  initializeSubscription() {},
  reactivateSubscription() {},
  process({ subscriptionContext } = {}) {
    if (
      this.status === SubscriptionStatus.INITIAL &&
      this.nextStatus() === SubscriptionStatus.ACTIVE
    ) {
      this.initializeSubscription(subscriptionContext);
    }
    if (
      this.status === SubscriptionStatus.PAUSED &&
      this.nextStatus() === SubscriptionStatus.ACTIVE
    ) {
      this.reactivateSubscription(subscriptionContext);
    }
    return this.setStatus(this.nextStatus(), 'subscription processed');
  },
  nextStatus() {
    let { status } = this;
    const director = this.director();

    if (
      status === SubscriptionStatus.INITIAL ||
      status === SubscriptionStatus.PAUSED
    ) {
      if (Promise.await(director.isValidForActivation())) {
        status = SubscriptionStatus.ACTIVE;
      }
    } else if (status === SubscriptionStatus.ACTIVE) {
      if (Promise.await(director.isOverdue())) {
        status = SubscriptionStatus.PAUSED;
      }
    } else if (this.isExpired()) {
      status = SubscriptionStatus.TERMINATED;
    }
    return status;
  },
  director() {
    const director = new SubscriptionDirector(this);
    return director;
  },
  setStatus(status, info) {
    return Subscriptions.updateStatus({
      subscriptionId: this._id,
      status,
      info,
    });
  },
  logs({ limit, offset }) {
    const selector = { 'meta.subscriptionId': this._id };
    const logs = Logs.find(selector, {
      skip: offset,
      limit,
      sort: {
        created: -1,
      },
    }).fetch();
    return logs;
  },
  isExpired(referenceDate) {
    const now = new Date() || referenceDate;
    const expiryDate = new Date(this.expires);
    const isExpired = now.getTime() > expiryDate.getTime();
    return isExpired;
  },
});

Subscriptions.generateFromCheckout = async ({ items, order, ...context }) => {
  const payment = order.payment();
  const delivery = order.delivery();
  const template = {
    orderId: order._id,
    userId: order.userId,
    countryCode: order.countryCode,
    currencyCode: order.currency,
    billingAddress: order.billingAddress,
    contact: order.contact,
    payment: {
      paymentProviderId: payment.paymentProviderId,
      context: payment.context,
    },
    delivery: {
      deliveryProviderId: delivery.deliveryProviderId,
      context: delivery.context,
    },
    meta: order.meta,
  };
  return Promise.all(
    items.map(async (item) => {
      const subscriptionData = await SubscriptionDirector.transformOrderItemToSubscription(
        item,
        { ...template, ...context }
      );
      const subscription = Subscriptions.createSubscription(subscriptionData);
      subscription.addOrder(order);
    })
  );
};

Subscriptions.createSubscription = (
  {
    productId,
    quantity,
    configuration,
    userId,
    countryCode,
    currencyCode,
    contact,
    billingAddress,
    payment,
    delivery,
  },
  options
) => {
  log('Create Subscription', { userId });
  const subscriptionId = Subscriptions.insert({
    productId,
    quantity,
    configuration,
    created: new Date(),
    status: SubscriptionStatus.INITIAL,
    userId,
    contact,
    billingAddress,
    payment,
    delivery,
    currencyCode:
      currencyCode ||
      Countries.resolveDefaultCurrencyCode({
        isoCode: countryCode,
      }),
    countryCode,
  });
  const subscription = Subscriptions.findOne({ _id: subscriptionId });
  return subscription.process().sendStatusToCustomer(options);
};

Subscriptions.updateContext = ({ context, subscriptionId }) => {
  log('Update Arbitrary Context', { subscriptionId });
  Subscriptions.update(
    { _id: subscriptionId },
    {
      $set: {
        context,
        updated: new Date(),
      },
    }
  );
  return Subscriptions.findOne({ _id: subscriptionId });
};

Subscriptions.newSubscriptionNumber = () => {
  let subscriptionNumber = null;
  const hashids = new Hashids(
    'unchained',
    6,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
  );
  while (!subscriptionNumber) {
    const randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
    const newHashID = hashids.encode(randomNumber);
    if (
      Subscriptions.find(
        { subscriptionNumber: newHashID },
        { limit: 1 }
      ).count() === 0
    ) {
      subscriptionNumber = newHashID;
    }
  }
  return subscriptionNumber;
};

Subscriptions.updateStatus = ({ status, subscriptionId, info = '' }) => {
  const subscription = Subscriptions.findOne({ _id: subscriptionId });
  if (subscription.status === status) return subscription;
  const date = new Date();
  const modifier = {
    $set: { status, updated: new Date() },
    $push: {
      log: {
        date,
        status,
        info,
      },
    },
  };
  log(`New Status: ${status}`, { subscriptionId });
  Subscriptions.update({ _id: subscriptionId }, modifier);
  return Subscriptions.findOne({ _id: subscriptionId });
};
