import Hashids from 'hashids/cjs';
import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { objectInvert } from 'meteor/unchained:utils';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import {
  Subscriptions,
  SubscriptionDirector,
} from 'meteor/unchained:core-subscriptions';
import { Countries } from 'meteor/unchained:core-countries';
import { Users } from 'meteor/unchained:core-users';
import { Logs, log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import {
  OrderPricingDirector,
  OrderPricingSheet,
} from 'meteor/unchained:core-pricing';
import { OrderStatus } from './schema';
import { Orders } from './collections';
import { OrderDeliveries } from '../order-deliveries/collections';
import { OrderDiscounts } from '../order-discounts/collections';
import { OrderPayments } from '../order-payments/collections';
import { OrderDocuments } from '../order-documents/collections';
import { OrderPositions } from '../order-positions/collections';
import settings from '../../settings';

const buildFindSelector = ({ includeCarts }) => {
  const selector = {};
  if (!includeCarts) selector.status = { $ne: OrderStatus.OPEN };

  return selector;
};

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

      await Subscriptions.createSubscription({
        ...subscriptionData,
        orderIdForFirstPeriod: order._id,
      });
    })
  );
};

Subscriptions.helpers({
  async generateOrder({ products, orderContext, ...configuration }) {
    if (!this.payment || !this.delivery) return null;
    const cart = await Orders.createOrder({
      user: this.user(),
      currency: this.currencyCode,
      countryCode: this.countryCode,
      contact: this.contact,
      billingAddress: this.billingAddress,
      originSubscriptionId: this._id,
      ...configuration,
    });
    if (products) {
      products.forEach(cart.addProductItem);
    } else {
      cart.addProductItem({
        product: this.product(),
        quantity: 1,
      });
    }
    const { paymentProviderId, paymentContext } = this.payment;
    if (paymentProviderId) {
      cart.setPaymentProvider({
        paymentProviderId,
      });
    }
    const { deliveryProviderId, deliveryContext } = this.delivery;
    if (deliveryProviderId) {
      cart.setDeliveryProvider({
        deliveryProviderId,
      });
    }
    const order = cart.checkout({
      paymentContext,
      deliveryContext,
      orderContext,
    });
    return order;
  },
});

Logs.helpers({
  order() {
    return (
      this.meta &&
      Orders.findOne({
        _id: this.meta.orderId,
      })
    );
  },
});

Users.helpers({
  async cart({ countryContext, orderNumber } = {}) {
    const selector = {
      countryCode: countryContext || this.lastLogin.countryContext,
      status: { $eq: OrderStatus.OPEN },
    };
    if (orderNumber) selector.orderNumber = orderNumber;
    const carts = await this.orders(selector);
    if (carts.length > 0) {
      return carts[0];
    }
    return null;
  },
  async orders({ includeCarts = false, status, ...rest } = {}) {
    const selector = { userId: this._id, ...rest };
    if (!includeCarts || status) {
      selector.status = status || { $ne: OrderStatus.OPEN };
    }
    const options = {
      sort: {
        updated: -1,
      },
    };
    const orders = Orders.find(selector, options).fetch();
    return orders;
  },
});

Orders.orderExists = ({ orderId, orderNumber }) => {
  const selector = orderId ? { _id: orderId } : { orderNumber };
  return !!Orders.find(selector).count();
};

Orders.findOrder = ({ orderId, ...rest }, options) => {
  const selector = orderId ? { _id: orderId } : rest;
  return Orders.findOne(selector, options);
};

Orders.removeOrder = ({ orderId }) => {
  return Orders.remove({ _id: orderId });
};

Orders.findOrders = ({
  limit,
  offset,
  sort = {
    created: -1,
  },
  ...query
}) => {
  const options = {
    skip: offset,
    limit,
    sort,
  };
  return Orders.find(buildFindSelector(query), options).fetch();
};

Orders.count = async (query) => {
  const count = await Orders.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};

Orders.helpers({
  subscription() {
    return Subscriptions.findOne({
      'periods.orderId': this._id,
    });
  },
  discounts() {
    return OrderDiscounts.find({ orderId: this._id }).fetch();
  },
  discounted({ orderDiscountId }) {
    const payment = this.payment();
    const delivery = this.delivery();

    const discounted = [
      ...(payment?.discounts(orderDiscountId) || []),
      ...(delivery?.discounts(orderDiscountId) || []),
      ...this.items().flatMap((item) => item.discounts(orderDiscountId)),
      ...this.pricing()
        .discountPrices(orderDiscountId)
        .map((discount) => ({
          order: this,
          ...discount,
        })),
    ].filter(Boolean);

    return discounted;
  },
  discountTotal({ orderDiscountId }) {
    const payment = this.payment();
    const delivery = this.delivery();

    const prices = [
      payment?.pricing().discountSum(orderDiscountId),
      delivery?.pricing().discountSum(orderDiscountId),
      ...this.items().flatMap((item) =>
        item.pricing().discountSum(orderDiscountId)
      ),
      this.pricing().discountSum(orderDiscountId),
    ];
    const amount = prices.reduce(
      (oldValue, price) => oldValue + (price || 0),
      0
    );
    return {
      amount,
      currency: this.currency,
    };
  },
  addDiscount({ code }) {
    return OrderDiscounts.createManualOrderDiscount({
      orderId: this._id,
      code,
    });
  },
  async initProviders() {
    const order = await this.initPreferredDeliveryProvider();
    return order.initPreferredPaymentProvider();
  },
  async initPreferredPaymentProvider() {
    const supportedPaymentProviders = PaymentProviders.findSupported({
      order: this,
    });

    const paymentProviderId = this.payment()?.paymentProviderId;
    const isAlreadyInitializedWithSupportedProvider = supportedPaymentProviders.some(
      (provider) => {
        return provider._id === paymentProviderId;
      }
    );
    if (
      supportedPaymentProviders.length > 0 &&
      !isAlreadyInitializedWithSupportedProvider
    ) {
      const paymentCredentials = await this.user()?.paymentCredentials({
        isPreferred: true,
      });
      if (paymentCredentials?.length) {
        const foundSupportedPreferredProvider = supportedPaymentProviders.find(
          (supportedPaymentProvider) => {
            return paymentCredentials.some((paymentCredential) => {
              return (
                supportedPaymentProvider._id ===
                paymentCredential.paymentProviderId
              );
            });
          }
        );
        if (foundSupportedPreferredProvider) {
          return this.setPaymentProvider({
            paymentProviderId: foundSupportedPreferredProvider._id,
          });
        }
      }
      return this.setPaymentProvider({
        paymentProviderId: supportedPaymentProviders[0]._id,
      });
    }
    return this;
  },
  async initPreferredDeliveryProvider() {
    const supportedDeliveryProviders = DeliveryProviders.findSupported({
      order: this,
    });

    const deliveryProviderId = this.delivery()?.deliveryProviderId;
    const isAlreadyInitializedWithSupportedProvider = supportedDeliveryProviders.some(
      (provider) => {
        return provider._id === deliveryProviderId;
      }
    );

    if (
      supportedDeliveryProviders.length > 0 &&
      !isAlreadyInitializedWithSupportedProvider
    ) {
      return this.setDeliveryProvider({
        deliveryProviderId: supportedDeliveryProviders[0]._id,
      });
    }
    return this;
  },
  setDeliveryProvider({ deliveryProviderId }) {
    return Orders.setDeliveryProvider({
      orderId: this._id,
      deliveryProviderId,
    });
  },
  setPaymentProvider({ paymentProviderId }) {
    return Orders.setPaymentProvider({
      orderId: this._id,
      paymentProviderId,
    });
  },
  items(props) {
    return OrderPositions.find({
      orderId: this._id,
      quantity: { $gt: 0 },
      ...props,
    }).fetch();
  },
  addQuotationItem({ quotation, ...quotationItemConfiguration }) {
    const { quantity, configuration } = quotation.transformItemConfiguration(
      quotationItemConfiguration
    );
    const product = quotation.product();
    return this.addProductItem({
      product,
      quantity,
      configuration,
      quotationId: quotation._id,
    });
  },
  addProductItem({ product, quantity, configuration, ...rest }) {
    const resolvedProduct = product.resolveOrderableProduct({
      quantity,
      configuration,
    });
    return OrderPositions.upsertPosition({
      orderId: this._id,
      productId: resolvedProduct._id,
      originalProductId: product._id,
      quantity,
      configuration,
      ...rest,
    });
  },
  user() {
    return Users.findOne({
      _id: this.userId,
    });
  },
  normalizedStatus() {
    return objectInvert(OrderStatus)[this.status || null];
  },
  pricing() {
    const pricing = new OrderPricingSheet({
      calculation: this.calculation,
      currency: this.currency,
    });
    return pricing;
  },
  delivery() {
    return OrderDeliveries.findOne({ _id: this.deliveryId });
  },
  payment() {
    return OrderPayments.findOne({ _id: this.paymentId });
  },
  updateBillingAddress(billingAddress = {}) {
    return Orders.updateBillingAddress({
      orderId: this._id,
      billingAddress,
    });
  },
  updateContact(contact = {}) {
    return Orders.updateContact({
      orderId: this._id,
      contact,
    });
  },
  updateContext(context) {
    if (!this.context && !context) return this;
    return Orders.updateContext({
      orderId: this._id,
      context,
    });
  },
  totalQuantity() {
    return this.items().reduce((oldValue, item) => oldValue + item.quantity, 0);
  },
  itemValidationErrors() {
    // Check if items are valid
    const items = this.items();
    if (items.length === 0) {
      const NoItemsError = new Error('No items to checkout');
      NoItemsError.name = 'NoItemsError';
      return [NoItemsError];
    }
    return items.flatMap((item) => item.validationErrors());
  },
  reserveItems() {
    // If we came here, the checkout succeeded, so we can reserve the items
    this.items().forEach((item) => item.reserve());

    // TODO: we will use this function to keep a "Ordered in Flight" amount, allowing us to
    // do live stock stuff
    // 2. Reserve quantity at Warehousing Provider until order is CANCELLED/FULLFILLED
    // ???
  },
  generateSubscriptions(context) {
    if (this.originSubscriptionId) return;
    const items = this.items().filter((item) => {
      const productPlan = item.product()?.plan;
      return !!productPlan;
    });

    if (items.length > 0) {
      Promise.await(
        Subscriptions.generateFromCheckout({
          order: this,
          items,
          ...context,
        })
      );
    }
  },
  async checkout(
    { paymentContext, deliveryContext, orderContext } = {},
    options
  ) {
    const errors = [
      ...this.missingInputDataForCheckout(),
      ...this.itemValidationErrors(),
    ].filter(Boolean);
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
    const locale = this.user().locale(options);

    const updatedOrderContext = this.updateContext(orderContext)
      .processOrder({ paymentContext, deliveryContext })
      .sendOrderConfirmationToCustomer({ locale });

    await Orders.ensureCartForUser({
      user: this.user(),
      countryContext: locale.country,
    });
    return updatedOrderContext;
  },
  confirm({ orderContext, paymentContext, deliveryContext }, options) {
    if (this.status !== OrderStatus.PENDING) return this;
    const locale = this.user().locale(options);
    return this.updateContext(orderContext)
      .setStatus(OrderStatus.CONFIRMED, 'confirmed manually')
      .processOrder({ paymentContext, deliveryContext })
      .sendOrderConfirmationToCustomer({ locale });
  },
  missingInputDataForCheckout() {
    const errors = [];
    if (this.status !== OrderStatus.OPEN)
      errors.push(new Error('Order has already been checked out'));
    if (!this.contact) errors.push(new Error('Contact data not provided'));
    if (!this.billingAddress)
      errors.push(new Error('Billing address not provided'));
    if (this.totalQuantity() === 0) errors.push(new Error('No items in cart'));
    if (!this.delivery()) errors.push('No delivery provider selected');
    if (!this.payment()) errors.push('No payment provider selected');
    return errors;
  },
  sendOrderConfirmationToCustomer({ locale }) {
    // send message with high priority
    WorkerDirector.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        locale,
        template: 'ORDER_CONFIRMATION',
        orderId: this._id,
      },
    });
    return this;
  },
  processOrder({ paymentContext, deliveryContext } = {}) {
    if (this.nextStatus() === OrderStatus.PENDING) {
      // auto charge during transition to pending
      this.payment().charge(paymentContext, this);
      this.storeLastUserData();
    }

    if (this.nextStatus() === OrderStatus.CONFIRMED) {
      if (this.status !== OrderStatus.CONFIRMED) {
        // we have to stop here shortly to complete the confirmation
        // before auto delivery is started, else we have no chance to create
        // documents and numbers that are needed for delivery
        const newConfirmedOrder = this.setStatus(
          OrderStatus.CONFIRMED,
          'before delivery'
        );
        this.delivery().send(deliveryContext, newConfirmedOrder);
        newConfirmedOrder.generateSubscriptions({
          paymentContext,
          deliveryContext,
        });
      } else {
        this.delivery().send(deliveryContext, this);
      }
      this.reserveItems();
    }
    return this.setStatus(this.nextStatus(), 'order processed');
  },
  setStatus(status, info) {
    return Orders.updateStatus({
      orderId: this._id,
      status,
      info,
    });
  },
  nextStatus() {
    let { status } = this;
    if (status === OrderStatus.OPEN || !status) {
      if (this.isValidForCheckout()) {
        status = OrderStatus.PENDING;
      }
    }
    if (status === OrderStatus.PENDING) {
      if (this.isAutoConfirmationEnabled()) {
        status = OrderStatus.CONFIRMED;
      }
    }
    if (status === OrderStatus.CONFIRMED) {
      if (this.isAutoFullfillmentEnabled()) {
        status = OrderStatus.FULLFILLED;
      }
    }
    return status;
  },
  storeLastUserData() {
    Users.updateLastBillingAddress({
      userId: this.userId,
      lastBillingAddress: this.billingAddress,
    });
    Users.updateLastContact({
      userId: this.userId,
      lastContact: this.contact,
    });
  },
  isValidForCheckout() {
    return this.missingInputDataForCheckout().length === 0;
  },
  isAutoConfirmationEnabled() {
    if (this.payment().isBlockingOrderConfirmation()) return false;
    if (this.delivery().isBlockingOrderConfirmation()) return false;
    if (
      this.status === OrderStatus.FULLFILLED ||
      this.status === OrderStatus.CONFIRMED
    )
      return false;
    return true;
  },
  isAutoFullfillmentEnabled() {
    if (this.payment().isBlockingOrderFullfillment()) return false;
    if (this.delivery().isBlockingOrderFullfillment()) return false;
    if (this.status === OrderStatus.FULLFILLED) return false;
    return true;
  },
  addDocument(objOrString, meta, options = {}) {
    if (typeof objOrString === 'string' || objOrString instanceof String) {
      return Promise.await(
        OrderDocuments.insertWithRemoteURL({
          url: objOrString,
          ...options,
          meta: {
            orderId: this._id,
            ...meta,
          },
        })
      );
    }
    const { rawFile, userId } = objOrString;
    return Promise.await(
      OrderDocuments.insertWithRemoteBuffer({
        file: rawFile,
        userId,
        ...options,
        meta: {
          orderId: this._id,
          ...meta,
        },
      })
    );
  },
  documents(options) {
    const { type } = options || {};
    const selector = { 'meta.orderId': this._id };
    if (type) {
      selector['meta.type'] = type;
    }
    return OrderDocuments.find(selector, { sort: { 'meta.date': -1 } }).each();
  },
  document(options) {
    const { type } = options || {};
    const selector = { 'meta.orderId': this._id };
    if (type) {
      selector['meta.type'] = type;
    }
    return OrderDocuments.findOne(selector, { sort: { 'meta.date': -1 } });
  },
  country() {
    return Countries.findOne({ isoCode: this.countryCode });
  },
  logs({ limit, offset }) {
    const selector = { 'meta.orderId': this._id };
    const logs = Logs.find(selector, {
      skip: offset,
      limit,
      sort: {
        created: -1,
      },
    }).fetch();
    return logs;
  },
  transformedContextValue(key) {
    const provider = this.provider();
    if (provider) {
      return provider.transformContext(key, this.context[key]);
    }
    return JSON.stringify(this.context[key]);
  },
  isCart() {
    return (this.status || null) === OrderStatus.OPEN;
  },
});

Orders.setDeliveryProvider = ({ orderId, deliveryProviderId }) => {
  const delivery = OrderDeliveries.findOne({ orderId, deliveryProviderId });
  const deliveryId = delivery
    ? delivery._id
    : OrderDeliveries.createOrderDelivery({ orderId, deliveryProviderId })._id;
  log(`Set Delivery Provider ${deliveryProviderId}`, { orderId });
  Orders.update(
    { _id: orderId },
    { $set: { deliveryId, updated: new Date() } }
  );
  Orders.updateCalculation({ orderId });
  return Orders.findOne({ _id: orderId });
};

Orders.setPaymentProvider = ({ orderId, paymentProviderId }) => {
  const payment = OrderPayments.findOne({ orderId, paymentProviderId });
  const paymentId = payment
    ? payment._id
    : OrderPayments.createOrderPayment({ orderId, paymentProviderId })._id;
  log(`Set Payment Provider ${paymentProviderId}`, { orderId });
  Orders.update({ _id: orderId }, { $set: { paymentId, updated: new Date() } });
  Orders.updateCalculation({ orderId });
  return Orders.findOne({ _id: orderId });
};

Orders.createOrder = async ({
  user,
  currency,
  countryCode,
  billingAddress,
  contact,
  ...rest
}) => {
  const orderId = Orders.insert({
    ...rest,
    created: new Date(),
    status: OrderStatus.OPEN,
    billingAddress:
      billingAddress || user.lastBillingAddress || user.profile?.address,
    contact:
      contact ||
      user.lastContact ||
      (!user.isGuest()
        ? {
            telNumber: user.telNumber(),
            emailAddress: user.primaryEmail()?.address,
          }
        : {}),
    userId: user._id,
    currency,
    countryCode,
  });
  return Orders.findOne({ _id: orderId }).initProviders();
};

Orders.updateBillingAddress = ({ billingAddress, orderId }) => {
  log('Update Invoicing Address', { orderId });
  Orders.update(
    { _id: orderId },
    {
      $set: {
        billingAddress,
        updated: new Date(),
      },
    }
  );
  Orders.updateCalculation({ orderId });
  return Orders.findOne({ _id: orderId });
};

Orders.updateContact = ({ contact, orderId }) => {
  log('Update Contact', { orderId });
  Orders.update(
    { _id: orderId },
    {
      $set: {
        contact,
        updated: new Date(),
      },
    }
  );
  Orders.updateCalculation({ orderId });
  return Orders.findOne({ _id: orderId });
};

Orders.updateContext = ({ context, orderId }) => {
  log('Update Arbitrary Context', { orderId });
  Orders.update(
    { _id: orderId },
    {
      $set: {
        context,
        updated: new Date(),
      },
    }
  );
  Orders.updateCalculation({ orderId });
  return Orders.findOne({ _id: orderId });
};

Orders.getUniqueOrderNumber = () => {
  let orderNumber = null;
  const hashids = new Hashids(
    'unchained',
    6,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
  );
  while (!orderNumber) {
    const randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
    const newHashID = hashids.encode(randomNumber);
    if (Orders.find({ orderNumber: newHashID }, { limit: 1 }).count() === 0) {
      orderNumber = newHashID;
    }
  }
  return orderNumber;
};

Orders.updateStatus = ({ status, orderId, info = '' }) => {
  const order = Orders.findOne({ _id: orderId });
  if (order.status === status) return order;
  const date = new Date();
  let shouldUpdateDocuments = false;
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
  switch (status) {
    // explicitly use fallthrough here!
    case OrderStatus.FULLFILLED:
      if (!order.fullfilled) {
        modifier.$set.fullfilled = date;
      }
    case OrderStatus.CONFIRMED: // eslint-disable-line no-fallthrough
      shouldUpdateDocuments = true;
      if (!order.confirmed) {
        modifier.$set.confirmed = date;
      }
    case OrderStatus.PENDING: // eslint-disable-line no-fallthrough
      if (!order.ordered) {
        modifier.$set.ordered = date;
      }
      if (!order.orderNumber) {
        // Order Numbers can be set by the user
        modifier.$set.orderNumber = Orders.getUniqueOrderNumber();
      }
      break;
    default:
      break;
  }
  // documents represent long-living state of orders,
  // so we only track when transitioning to confirmed or fullfilled status
  if (shouldUpdateDocuments) {
    try {
      // It's okay if this fails as it is not
      // super-vital to the
      // checkout process
      OrderDocuments.updateDocuments({
        orderId,
        date: modifier.$set.confirmed || order.confirmed,
        ...modifier.$set,
      });
    } catch (e) {
      log(e, { level: 'error', orderId });
    }
  }
  log(`New Status: ${status}`, { orderId });
  Orders.update({ _id: orderId }, modifier);
  return Orders.findOne({ _id: orderId });
};

Orders.updateCalculation = ({ orderId }) => {
  OrderDiscounts.updateDiscounts({ orderId });

  const order = Promise.await(Orders.findOne({ _id: orderId }).initProviders());
  const items = order.items();

  const updatedItems = items.map((item) => item.updateCalculation());
  order.delivery()?.updateCalculation(); // eslint-disable-line
  order.payment()?.updateCalculation(); // eslint-disable-line

  updatedItems.forEach((item) => item.updateScheduling());

  const pricing = new OrderPricingDirector({ item: order });
  const calculation = pricing.calculate();
  return Orders.update(
    { _id: orderId },
    {
      $set: {
        calculation,
        updated: new Date(),
      },
    }
  );
};

Orders.ensureCartForUser = async ({ userId, user, countryContext }) => {
  if (!settings.ensureUserHasCart) return;
  const userObject = user || Users.findUser({ userId });
  if (!userObject) throw new Error('User with the id not found');
  const countryCode = countryContext || userObject.lastLogin.countryContext;

  const cart = await userObject?.cart({
    countryContext: countryCode,
  });

  if (cart) return;

  Orders.createOrder({
    user: userObject,
    currency: Countries.resolveDefaultCurrencyCode({
      isoCode: countryCode,
    }),
    countryCode,
  });
};

Orders.migrateCart = async ({
  fromUserId,
  toUserId,
  countryContext,
  mergeCarts,
}) => {
  const fromCart = await Users.findOne({ _id: fromUserId }).cart({
    countryContext,
  });
  const toCart = await Users.findOne({ _id: toUserId }).cart({
    countryContext,
  });

  if (!fromCart) {
    // No cart, don't copy
    return;
  }
  if (!toCart || !mergeCarts) {
    // No destination cart, move whole cart
    Orders.update(
      { _id: fromCart._id },
      {
        $set: {
          userId: toUserId,
        },
      }
    );
    Orders.updateCalculation({
      orderId: fromCart._id,
    });
    return;
  }
  // Move positions
  OrderPositions.update(
    { orderId: fromCart._id },
    {
      $set: {
        orderId: toCart._id,
      },
    },
    {
      multi: true,
    }
  );
  Orders.updateCalculation({
    orderId: fromCart._id,
  });
  Orders.updateCalculation({
    orderId: toCart._id,
  });
};

Orders.invalidateProviders = async () => {
  log('Orders: Start invalidating cart providers', { level: 'verbose' });
  Orders.find({
    status: { $eq: OrderStatus.OPEN },
  })
    .fetch()
    .forEach((order) => {
      order.initProviders();
    });
};

Orders.assignCartForExistingUsers = async () => {
  const users = await Users.find({}).fetch();
  users.map((user) => Orders.ensureCartForUser({ user }));
};
