import Hashids from 'hashids';
import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { getFallbackLocale } from 'meteor/unchained:core';
import { objectInvert } from 'meteor/unchained:utils';
import { Users } from 'meteor/unchained:core-users';
import { Logs, log } from 'meteor/unchained:core-logger';
import { MessagingDirector, MessagingType } from 'meteor/unchained:core-messaging';
import { Quotations } from './collections';
import { QuotationStatus } from './schema';

const {
  EMAIL_FROM,
  UI_ENDPOINT,
} = process.env;

Logs.helpers({
  quotation() {
    return this.meta && Quotations.findOne({
      _id: this.meta.quotationId,
    });
  },
});

Users.helpers({
  quotations() {
    return Quotations.find({ userId: this._id }, {
      sort: {
        created: -1,
      },
    }).fetch();
  },
});

Quotations.helpers({
  user() {
    return Users.findOne({
      _id: this.userId,
    });
  },
  normalizedStatus() {
    return objectInvert(QuotationStatus)[this.status];
  },
  updateContext(context) {
    return Quotations.updateContext({
      orderId: this._id,
      context,
    });
  },
  verify({ meta }, { localeContext }) {
    if (this.status !== QuotationStatus.REQUESTED) return this;
    const lastUserLanguage = this.user().language();
    const language = (localeContext && localeContext.normalized)
      || (lastUserLanguage && lastUserLanguage.isoCode);
    return this
      .setStatus(QuotationStatus.PROCESSING, 'verified elligibility manually')
      .process({ meta })
      .sendStatusToCustomer({ language });
  },
  sendStatusToCustomer({ language }) {
    const attachments = [];
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
    const locale = (user && user.lastLogin && user.lastLogin.locale)
      || getFallbackLocale().normalized;
    const director = new MessagingDirector({
      locale,
      order: this,
      type: MessagingType.EMAIL,
    });
    const format = (price) => {
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
        positions: this.items().map((item) => {
          const texts = item.product().getLocalizedTexts(language);
          const product = texts && texts.title;
          const total = format(item.pricing().sum());
          const { quantity } = item;
          return { quantity, product, total };
        }),
      },
    });
    return this;
  },
  process({ paymentContext, deliveryContext } = {}) {
    if (this.nextStatus() === QuotationStatus.PENDING) {
      // auto charge during transition to pending
      this.payment().charge(paymentContext, this);
    }

    if (this.nextStatus() === QuotationStatus.CONFIRMED) {
      if (this.status !== QuotationStatus.CONFIRMED) {
        // we have to stop here shortly to complete the confirmation
        // before auto delivery is started, else we have no chance to create
        // documents and numbers that are needed for delivery
        const newConfirmedOrder = this.setStatus(QuotationStatus.CONFIRMED, 'before delivery');
        this.delivery().send(deliveryContext, newConfirmedOrder);
      } else {
        this.delivery().send(deliveryContext, this);
      }
    }
    return this.setStatus(this.nextStatus(), 'order processed');
  },
  setStatus(status, info) {
    return Quotations.updateStatus({
      orderId: this._id,
      status,
      info,
    });
  },
  nextStatus() {
    let { status } = this;
    if (status === QuotationStatus.REQUESTED || !status) {
      if (this.isAutoVerificationEnabled()) {
        status = QuotationStatus.PROCESSING;
      }
    }
    if (status === QuotationStatus.PROCESSING) {
      if (this.isAutoOfferingEnabled()) {
        status = QuotationStatus.PROPOSED;
      }
    }
    return status;
  },
  isAutoVerificationEnabled() {
    return true;
  },
  isAutoOfferingEnabled() {
    return true;
  },
  addDocument(objOrString, meta, options = {}) {
    if (typeof objOrString === 'string' || objOrString instanceof String) {
      return Promise.await(QuotationDocuments.insertWithRemoteURL({
        url: objOrString,
        ...options,
        meta: {
          quotationId: this._id,
          ...meta,
        },
      }));
    }
    const { rawFile, userId } = objOrString;
    return Promise.await(QuotationDocuments.insertWithRemoteBuffer({
      file: rawFile,
      userId,
      ...options,
      meta: {
        quotationId: this._id,
        ...meta,
      },
    }));
  },
  documents(options) {
    const { type } = options || {};
    const selector = { 'meta.quotationId': this._id };
    if (type) {
      selector['meta.type'] = type;
    }
    return QuotationDocuments.find(selector, { sort: { 'meta.date': -1 } }).each();
  },
  document(options) {
    const { type } = options || {};
    const selector = { 'meta.quotationId': this._id };
    if (type) {
      selector['meta.type'] = type;
    }
    return QuotationDocuments.findOne(selector, { sort: { 'meta.date': -1 } });
  },
  logs({ limit = 10, offset = 0 }) {
    const selector = { 'meta.quotationId': this._id };
    const logs = Logs.find(selector, {
      skip: offset,
      limit,
      sort: {
        created: -1,
      },
    }).fetch();
    return logs;
  },
});

Quotations.createOrder = ({
  userId, currency, countryCode, ...rest
}) => {
  const user = Users.findOne({ _id: userId });
  log('Create Order', { userId });
  const orderId = Quotations.insert({
    ...rest,
    created: new Date(),
    status: QuotationStatus.OPEN,
    billingAddress: user.lastBillingAddress,
    contact: user.isGuest() ? {} : {
      telNumber: user.telNumber(),
      emailAddress: user.email(),
    },
    userId,
    currency,
    countryCode,
  });
  const order = Quotations.findOne({ _id: orderId });
  return order.init();
};

Quotations.updateContext = ({ context, orderId }) => {
  log('Update Arbitrary Context', { orderId });
  Quotations.update({ _id: orderId }, {
    $set: {
      context,
      updated: new Date(),
    },
  });
  Quotations.updateCalculation({ orderId });
  return Quotations.findOne({ _id: orderId });
};

Quotations.newOrderNumber = () => {
  let orderNumber = null;
  const hashids = new Hashids('unchained', 6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
  while (!orderNumber) {
    const randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
    const newHashID = hashids.encode(randomNumber);
    if (Quotations.find({ orderNumber: newHashID }, { limit: 1 }).count() === 0) {
      orderNumber = newHashID;
    }
  }
  return orderNumber;
};

Quotations.updateStatus = ({ status, orderId, info = '' }) => {
  const order = Quotations.findOne({ _id: orderId });
  if (order.status === status) return order;
  const date = new Date();
  let isShouldUpdateDocuments = false;
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
    case QuotationStatus.FULLFILLED:
      if (!order.fullfilled) {
        modifier.$set.fullfilled = date;
      }
    case QuotationStatus.CONFIRMED: // eslint-disable-line no-fallthrough
      isShouldUpdateDocuments = true;
      if (!order.confirmed) {
        modifier.$set.confirmed = date;
      }
    case QuotationStatus.PENDING: // eslint-disable-line no-fallthrough
      if (!order.ordered) {
        modifier.$set.ordered = date;
        modifier.$set.orderNumber = Quotations.newOrderNumber();
      }
      break;
    default:
      break;
  }
  // documents represent long-living state of orders,
  // so we only track when transitioning to confirmed or fullfilled status
  if (isShouldUpdateDocuments) {
    try {
      // we are now allowed to stop this process, else we could
      // end up with non-confirmed but charged orders.
      QuotationDocuments.updateDocuments({
        orderId,
        date: modifier.$set.confirmed || order.confirmed,
        ...modifier.$set,
      });
    } catch (e) {
      log(e, { level: 'error' });
    }
  }
  log(`New Status: ${status}`, { orderId });
  Quotations.update({ _id: orderId }, modifier);
  return Quotations.findOne({ _id: orderId });
};
