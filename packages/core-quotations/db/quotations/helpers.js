import Hashids from 'hashids';
import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { getFallbackLocale } from 'meteor/unchained:core';
import { objectInvert } from 'meteor/unchained:utils';
import { Users } from 'meteor/unchained:core-users';
import { Products } from 'meteor/unchained:core-products';
import { Countries } from 'meteor/unchained:core-countries';
import { Logs, log } from 'meteor/unchained:core-logger';
import { MessagingDirector, MessagingType } from 'meteor/unchained:core-messaging';
import { Quotations } from './collections';
import { QuotationDocuments } from '../quotation-documents/collections';
import { QuotationStatus } from './schema';
import { QuotationDirector } from '../../director';

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
  product() {
    return Products.findOne({
      _id: this.productId,
    });
  },
  normalizedStatus() {
    return objectInvert(QuotationStatus)[this.status];
  },
  updateContext(context) {
    return Quotations.updateContext({
      quotationId: this._id,
      context,
    });
  },
  verify({ quotationContext }, { localeContext }) {
    if (this.status !== QuotationStatus.REQUESTED) return this;
    const lastUserLanguage = this.user().language();
    const language = (localeContext && localeContext.normalized)
      || (lastUserLanguage && lastUserLanguage.isoCode);
    return this
      .setStatus(QuotationStatus.PROCESSING, 'verified elligibility manually')
      .process({ quotationContext })
      .sendStatusToCustomer({ language });
  },
  propose({ quotationContext }, { localeContext }) {
    if (this.status !== QuotationStatus.PROCESSING) return this;
    const lastUserLanguage = this.user().language();
    const language = (localeContext && localeContext.normalized)
      || (lastUserLanguage && lastUserLanguage.isoCode);
    return this
      .setStatus(QuotationStatus.PROPOSED, 'proposed manually')
      .process({ quotationContext })
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
      quotation: this,
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
        mailPrefix: `${this.quotationNumber}_`,
        from: EMAIL_FROM,
        to: this.contact.emailAddress,
        url: `${UI_ENDPOINT}/order?_id=${this._id}&otp=${this.quotationNumber}`,
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
  process({ quotationContext } = {}) {
    if (this.nextStatus() === QuotationStatus.PROPOSED) {
      this.buildProposal(quotationContext);
    }
    return this.setStatus(this.nextStatus(), 'quotation processed');
  },
  nextStatus() {
    let { status } = this;
    const controller = this.controller();

    if (status === QuotationStatus.REQUESTED || !status) {
      if (!Promise.await(controller.manualRequestVerificationNeeded())) {
        status = QuotationStatus.PROCESSING;
      }
    }
    if (status === QuotationStatus.PROCESSING) {
      if (!Promise.await(controller.manualProposalNeeded())) {
        status = QuotationStatus.PROPOSED;
      }
    }
    return status;
  },
  buildProposal(quotationContext) {
    const controller = this.controller();
    const proposal = Promise.await(controller.quote(quotationContext));
    return Quotations.updateProposal({
      ...proposal,
      quotationId: this._id,
    });
  },
  controller() {
    const director = new QuotationDirector(this);
    return director;
  },
  setStatus(status, info) {
    return Quotations.updateStatus({
      quotationId: this._id,
      status,
      info,
    });
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

Quotations.requestQuotation = ({
  productId, userId, currencyCode, ...rest
}) => {
  log('Create Quotation', { userId });
  const quotationId = Quotations.insert({
    ...rest,
    created: new Date(),
    status: QuotationStatus.REQUESTED,
    userId,
    productId,
    currency: Countries.resolveDefaultCurrencyCode({
      isoCode: currencyCode,
    }),
    countryCode: currencyCode,
  });
  const quotation = Quotations.findOne({ _id: quotationId });
  return quotation.process();
};

Quotations.updateContext = ({ context, quotationId }) => {
  log('Update Arbitrary Context', { quotationId });
  Quotations.update({ _id: quotationId }, {
    $set: {
      context,
      updated: new Date(),
    },
  });
  return Quotations.findOne({ _id: quotationId });
};

Quotations.updateProposal = ({
  price, expires, meta, quotationId,
}) => {
  log('Update Quotation with Proposal', { quotationId });
  Quotations.update({ _id: quotationId }, {
    $set: {
      price,
      expires,
      meta,
      updated: new Date(),
    },
  });
  return Quotations.findOne({ _id: quotationId });
};

Quotations.newQuotationNumber = () => {
  let quotationNumber = null;
  const hashids = new Hashids('unchained', 6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
  while (!quotationNumber) {
    const randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
    const newHashID = hashids.encode(randomNumber);
    if (Quotations.find({ quotationNumber: newHashID }, { limit: 1 }).count() === 0) {
      quotationNumber = newHashID;
    }
  }
  return quotationNumber;
};

Quotations.updateStatus = ({ status, quotationId, info = '' }) => {
  const quotation = Quotations.findOne({ _id: quotationId });
  if (quotation.status === status) return quotation;
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
      if (!quotation.fullfilled) {
        modifier.$set.fullfilled = date;
      }
    case QuotationStatus.PROPOSED: // eslint-disable-line no-fallthrough
      isShouldUpdateDocuments = true;
    case QuotationStatus.PROCESSING: // eslint-disable-line no-fallthrough
      if (!quotation.quotationNumber) {
        modifier.$set.quotationNumber = Quotations.newQuotationNumber();
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
        quotationId,
        date,
        ...modifier.$set,
      });
    } catch (e) {
      log(e, { level: 'error' });
    }
  }
  log(`New Status: ${status}`, { quotationId });
  Quotations.update({ _id: quotationId }, modifier);
  return Quotations.findOne({ _id: quotationId });
};
