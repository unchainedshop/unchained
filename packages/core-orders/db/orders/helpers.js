import Hashids from 'hashids';
import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { getFallbackLocale } from 'meteor/unchained:core';
import { objectInvert } from 'meteor/unchained:utils';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { Countries } from 'meteor/unchained:core-countries';
import { Users } from 'meteor/unchained:core-users';
import { Logs, log } from 'meteor/unchained:core-logger';
import {
  MessagingDirector,
  MessagingType
} from 'meteor/unchained:core-messaging';
import {
  OrderPricingDirector,
  OrderPricingSheet
} from 'meteor/unchained:core-pricing';
import { OrderStatus } from './schema';
import { Orders } from './collections';
import { OrderDeliveries } from '../order-deliveries/collections';
import { OrderDiscounts } from '../order-discounts/collections';
import { OrderPayments } from '../order-payments/collections';
import { OrderDocuments } from '../order-documents/collections';
import { OrderPositions } from '../order-positions/collections';

const { EMAIL_FROM, UI_ENDPOINT } = process.env;

Logs.helpers({
  order() {
    return (
      this.meta &&
      Orders.findOne({
        _id: this.meta.orderId
      })
    );
  }
});

Users.helpers({
  cart({ countryContext, orderNumber } = {}) {
    const selector = {
      countryCode: countryContext || this.lastLogin.country,
      status: { $eq: OrderStatus.OPEN }
    };
    if (orderNumber) selector.orderNumber = orderNumber;
    const carts = this.orders(selector);
    if (carts.length > 0) {
      return carts[0];
    }
    return null;
  },
  orders({ includeCarts = false, status, ...rest } = {}) {
    const selector = { userId: this._id, ...rest };
    if (!includeCarts || status) {
      selector.status = status || { $ne: OrderStatus.OPEN };
    }
    const options = {
      sort: {
        created: -1
      }
    };
    const orders = Orders.find(selector, options).fetch();
    return orders;
  }
});

Orders.helpers({
  init() {
    // initialize payment with default values
    const supportedPaymentProviders = this.supportedPaymentProviders();
    if (supportedPaymentProviders.length > 0) {
      this.setPaymentProvider({
        paymentProviderId: supportedPaymentProviders[0]._id
      });
    }
    // initialize delivery with default values
    const supportedDeliveryProviders = this.supportedDeliveryProviders();
    if (supportedDeliveryProviders.length > 0) {
      this.setDeliveryProvider({
        deliveryProviderId: supportedDeliveryProviders[0]._id
      });
    }
    return Orders.findOne({ _id: this._id });
  },
  discounts() {
    return OrderDiscounts.find({ orderId: this._id }).fetch();
  },
  discounted() {
    const discounted = [];
    this.payment()
      .discounts()
      .forEach(discount => discount && discounted.push(discount));
    this.delivery()
      .discounts()
      .forEach(discount => discount && discounted.push(discount));
    this.items().forEach(item =>
      item
        .discounts()
        .forEach(discount => discount && discounted.push(discount))
    );

    this.pricing()
      .discountPrices()
      .map(discount => ({
        order: this,
        ...discount
      }))
      .forEach(discount => discount && discounted.push(discount));
    return discounted;
  },
  discountTotal({ orderDiscountId }) {
    const payment = this.payment();
    const delivery = this.delivery();

    const totalOrder = this.pricing().discountSum(orderDiscountId);
    const totalPayment =
      payment && payment.pricing().discountSum(orderDiscountId);
    const totalDelivery =
      delivery && delivery.pricing().discountSum(orderDiscountId);
    const totalItems = this.items().reduce(
      (oldValue, item) =>
        oldValue + item.pricing().discountSum(orderDiscountId),
      0
    );
    return {
      amount: totalItems + totalDelivery + totalPayment + totalOrder,
      currency: this.currency
    };
  },
  addDiscount({ code }) {
    return OrderDiscounts.createManualOrderDiscount({
      orderId: this._id,
      code: code.toUpperCase()
    });
  },
  supportedDeliveryProviders() {
    return DeliveryProviders.findProviders().filter(provider =>
      provider.isActive(this)
    );
  },
  supportedPaymentProviders() {
    return PaymentProviders.findProviders().filter(provider =>
      provider.isActive(this)
    );
  },
  setDeliveryProvider({ deliveryProviderId }) {
    return Orders.setDeliveryProvider({
      orderId: this._id,
      deliveryProviderId
    });
  },
  setPaymentProvider({ paymentProviderId }) {
    return Orders.setPaymentProvider({
      orderId: this._id,
      paymentProviderId
    });
  },
  items(props) {
    return OrderPositions.find({
      orderId: this._id,
      quantity: { $gt: 0 },
      ...props
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
      quotationId: quotation._id
    });
  },
  addProductItem({ product, quantity, configuration, ...rest }) {
    const resolvedProduct = product.resolveOrderableProduct({
      quantity,
      configuration
    });
    return OrderPositions.upsertPosition({
      orderId: this._id,
      productId: resolvedProduct._id,
      originalProductId: product._id,
      quantity,
      configuration,
      ...rest
    });
  },
  user() {
    return Users.findOne({
      _id: this.userId
    });
  },
  normalizedStatus() {
    return objectInvert(OrderStatus)[this.status || null];
  },
  pricing() {
    const pricing = new OrderPricingSheet({
      calculation: this.calculation,
      currency: this.currency
    });
    return pricing;
  },
  delivery() {
    return OrderDeliveries.findOne({ _id: this.deliveryId });
  },
  payment() {
    return OrderPayments.findOne({ _id: this.paymentId });
  },
  updateBillingAddress(rawBillingAddress) {
    const billingAddress = {
      ...(rawBillingAddress || {}),
      countryCode: this.countryCode
    };
    Users.updateLastBillingAddress({
      userId: this.userId,
      lastBillingAddress: billingAddress
    });
    return Orders.updateBillingAddress({
      orderId: this._id,
      billingAddress
    });
  },
  updateContact({ contact }) {
    Users.updateLastContact({
      userId: this.userId,
      lastContact: contact
    });
    return Orders.updateContact({
      orderId: this._id,
      contact
    });
  },
  updateContext(context) {
    return Orders.updateContext({
      orderId: this._id,
      context
    });
  },
  totalQuantity() {
    return this.items().reduce((oldValue, item) => oldValue + item.quantity, 0);
  },
  itemValidationErrors() {
    // If we came here, the checkout succeeded, so we can reserve the items
    return this.items().flatMap(item => item.validationErrors());
  },
  reserveItems() {
    // If we came here, the checkout succeeded, so we can reserve the items
    this.items().forEach(item => item.reserve());

    // TODO: we will use this function to keep a "Ordered in Flight" amount, allowing us to
    // do live stock stuff
    // 2. Reserve quantity at Warehousing Provider until order is CANCELLED/FULLFILLED
    // ???
  },
  checkout(
    { paymentContext, deliveryContext, orderContext },
    { localeContext }
  ) {
    const errors = [
      ...this.missingInputDataForCheckout(),
      ...this.itemValidationErrors()
    ].filter(Boolean);
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
    const lastUserLanguage = this.user().language();
    const language =
      (localeContext && localeContext.normalized) ||
      (lastUserLanguage && lastUserLanguage.isoCode);
    return this.updateContext(orderContext)
      .processOrder({ paymentContext, deliveryContext })
      .sendOrderConfirmationToCustomer({ language });
  },
  confirm(
    { orderContext, paymentContext, deliveryContext },
    { localeContext }
  ) {
    if (this.status !== OrderStatus.PENDING) return this;
    const lastUserLanguage = this.user().language();
    const language =
      (localeContext && localeContext.normalized) ||
      (lastUserLanguage && lastUserLanguage.isoCode);
    return this.updateContext(orderContext)
      .setStatus(OrderStatus.CONFIRMED, 'confirmed manually')
      .processOrder({ paymentContext, deliveryContext })
      .sendOrderConfirmationToCustomer({ language });
  },
  missingInputDataForCheckout() {
    const errors = [];
    if (!this.contact) errors.push(new Error('Contact data not provided'));
    if (!this.billingAddress)
      errors.push(new Error('Billing address not provided'));
    if (this.totalQuantity() === 0) errors.push(new Error('No items in cart'));
    if (!this.delivery()) errors.push('No delivery provider selected');
    if (!this.payment()) errors.push('No payment provider selected');
    return errors;
  },
  sendOrderConfirmationToCustomer({ language }) {
    const attachments = [];
    // TODO: If this.status is PENDING, we should only send the user
    // a notice that we have received the order but not confirming it
    const confirmation = this.document({ type: 'ORDER_CONFIRMATION' });
    if (confirmation) attachments.push(confirmation);
    if (this.payment().isBlockingOrderFullfillment()) {
      const invoice = this.document({ type: 'INVOICE' });
      if (invoice) attachments.push(invoice);
    } else {
      const receipt = this.document({ type: 'RECEIPT' });
      if (receipt) attachments.push(receipt);
    }
    const user = this.user();
    const locale =
      (user && user.lastLogin && user.lastLogin.locale) ||
      getFallbackLocale().normalized;
    const director = new MessagingDirector({
      locale,
      order: this,
      type: MessagingType.EMAIL
    });
    const format = price => {
      const fixedPrice = price / 100;
      return `${this.currency} ${fixedPrice}`;
    };
    director.sendMessage({
      template: 'shop.unchained.orders.confirmation',
      attachments,
      meta: {
        mailPrefix: `${this.orderNumber}_`,
        from: EMAIL_FROM,
        to: this.contact.emailAddress,
        url: `${UI_ENDPOINT}/order?_id=${this._id}&otp=${this.orderNumber}`,
        summary: this.pricing().formattedSummary(format),
        positions: this.items().map(item => {
          const productTexts = item.product().getLocalizedTexts(language);
          const originalProductTexts = item
            .originalProduct()
            .getLocalizedTexts(language);
          const product = productTexts && productTexts.title; // deprected
          const total = format(item.pricing().sum());
          const { quantity } = item;
          return {
            quantity,
            product,
            productTexts,
            originalProductTexts,
            total
          };
        })
      }
    });
    return this;
  },
  processOrder({ paymentContext, deliveryContext } = {}) {
    if (this.nextStatus() === OrderStatus.PENDING) {
      // auto charge during transition to pending
      this.payment().charge(paymentContext, this);
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
      } else {
        this.delivery().send(deliveryContext, this);
      }
    }
    // no matter what happens, the items need to
    // get reserved if we came that far
    this.reserveItems();
    return this.setStatus(this.nextStatus(), 'order processed');
  },
  setStatus(status, info) {
    return Orders.updateStatus({
      orderId: this._id,
      status,
      info
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
            ...meta
          }
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
          ...meta
        }
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
        created: -1
      }
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
  }
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

Orders.createOrder = ({ user, currency, countryCode, ...rest }) => {
  const orderId = Orders.insert({
    ...rest,
    created: new Date(),
    status: OrderStatus.OPEN,
    billingAddress: user.lastBillingAddress,
    contact: user.isGuest()
      ? {}
      : {
          telNumber: user.telNumber(),
          emailAddress: user.email()
        },
    userId: user._id,
    currency,
    countryCode
  });
  const order = Orders.findOne({ _id: orderId });
  return order.init();
};

Orders.updateBillingAddress = ({ billingAddress, orderId }) => {
  log('Update Invoicing Address', { orderId });
  Orders.update(
    { _id: orderId },
    {
      $set: {
        billingAddress,
        updated: new Date()
      }
    }
  );
  Orders.updateCalculation({ orderId });
  return Orders.findOne({ _id: orderId });
};

Orders.updateContact = ({ contact, orderId }) => {
  log('Update Contact Information', { orderId });
  Orders.update(
    { _id: orderId },
    {
      $set: {
        contact,
        updated: new Date()
      }
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
        updated: new Date()
      }
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
        info
      }
    }
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
        ...modifier.$set
      });
    } catch (e) {
      log(e, { level: 'error' });
    }
  }
  log(`New Status: ${status}`, { orderId });
  Orders.update({ _id: orderId }, modifier);
  return Orders.findOne({ _id: orderId });
};

Orders.updateCalculation = ({ orderId, recalculateEverything }) => {
  const order = Orders.findOne({ _id: orderId });
  const items = order.items();
  log('Update Calculation', { orderId });
  if (recalculateEverything) {
    log('Whole Order Recalculation!', { orderId });
    items.forEach(({ _id }) =>
      OrderPositions.updateCalculation({ orderId, positionId: _id })
    );
    const delivery = order.delivery();
    const deliveryId = delivery && delivery._id;
    if (deliveryId) OrderDeliveries.updateCalculation({ orderId, deliveryId });
    const payment = order.payment();
    const paymentId = payment && payment._id;
    if (paymentId) OrderPayments.updateCalculation({ orderId, paymentId });
  }
  // always update the scheduling
  items.forEach(position => OrderPositions.updateScheduling({ position }));
  const pricing = new OrderPricingDirector({ item: order });
  const calculation = pricing.calculate();
  return Orders.update(
    { _id: orderId },
    {
      $set: {
        calculation,
        updated: new Date()
      }
    }
  );
};
