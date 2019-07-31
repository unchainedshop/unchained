import Hashids from 'hashids';
import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { objectInvert } from 'meteor/unchained:utils';
import { Users } from 'meteor/unchained:core-users';
import { Products } from 'meteor/unchained:core-products';
import { Countries } from 'meteor/unchained:core-countries';
import { Logs, log } from 'meteor/unchained:core-logger';
import {
  MessagingDirector,
  MessagingType
} from 'meteor/unchained:core-messaging';
import { Quotations } from './collections';
import { QuotationDocuments } from '../quotation-documents/collections';
import { QuotationStatus } from './schema';
import { QuotationDirector } from '../../director';

const { EMAIL_FROM, UI_ENDPOINT } = process.env;

Logs.helpers({
  quotation() {
    return (
      this.meta &&
      Quotations.findOne({
        _id: this.meta.quotationId
      })
    );
  }
});

Users.helpers({
  quotations() {
    return Quotations.find(
      { userId: this._id },
      {
        sort: {
          created: -1
        }
      }
    ).fetch();
  }
});

Quotations.helpers({
  user() {
    return Users.findOne({
      _id: this.userId
    });
  },
  product() {
    return Products.findOne({
      _id: this.productId
    });
  },
  normalizedStatus() {
    return objectInvert(QuotationStatus)[this.status || null];
  },
  async updateContext(context) {
    return Quotations.updateContext({
      quotationId: this._id,
      context
    });
  },
  async verify({ quotationContext } = {}, options) {
    if (this.status !== QuotationStatus.REQUESTED) return this;
    return this.setStatus(
      QuotationStatus.PROCESSING,
      'verified elligibility manually'
    )
      .then(async quotation => quotation.process({ quotationContext }))
      .then(async quotation => quotation.sendStatusToCustomer(options));
  },
  async reject({ quotationContext } = {}, options) {
    if (this.status === QuotationStatus.FULLFILLED) return this;
    return this.setStatus(QuotationStatus.REJECTED, 'rejected manually')
      .then(async quotation => quotation.process({ quotationContext }))
      .then(async quotation => quotation.sendStatusToCustomer(options));
  },
  async propose({ quotationContext } = {}, options) {
    if (this.status !== QuotationStatus.PROCESSING) return this;
    return this.setStatus(QuotationStatus.PROPOSED, 'proposed manually')
      .then(async quotation => quotation.process({ quotationContext }))
      .then(async quotation => quotation.sendStatusToCustomer(options));
  },
  async fullfill({ quotationContext, info } = {}, options) {
    if (this.status === QuotationStatus.FULLFILLED) return this;
    return this.setStatus(QuotationStatus.FULLFILLED, JSON.stringify(info))
      .then(async quotation => quotation.process({ quotationContext }))
      .then(async quotation => quotation.sendStatusToCustomer(options));
  },
  sendStatusToCustomer(options) {
    const user = this.user();
    const locale = user.locale(options).normalized;
    const attachments = [this.document({ type: 'PROPOSAL' })].filter(Boolean);
    const director = new MessagingDirector({
      locale,
      quotation: this,
      type: MessagingType.EMAIL
    });
    director.sendMessage({
      template: 'shop.unchained.quotations.proposal',
      attachments,
      meta: {
        mailPrefix: `${this.quotationNumber}_`,
        from: EMAIL_FROM,
        to: user.email(),
        url: `${UI_ENDPOINT}/quotation?_id=${this._id}&otp=${this.quotationNumber}`,
        quotation: this
      }
    });
    return this;
  },
  async process({ quotationContext } = {}) {
    if (
      this.status === QuotationStatus.REQUESTED &&
      (await this.nextStatus()) !== QuotationStatus.REQUESTED
    ) {
      await this.submitRequest(quotationContext);
    }
    if ((await this.nextStatus()) !== QuotationStatus.PROCESSING) {
      await this.verifyRequest(quotationContext);
    }
    if ((await this.nextStatus()) === QuotationStatus.PROPOSED) {
      await this.buildProposal(quotationContext);
    }
    return this.setStatus(await this.nextStatus(), 'quotation processed');
  },
  async transformItemConfiguration(itemConfiguration) {
    const director = this.director();
    return director.transformItemConfiguration(itemConfiguration);
  },
  async nextStatus() {
    let { status } = this;
    const director = this.director();

    if (status === QuotationStatus.REQUESTED) {
      if (!(await director.isManualRequestVerificationRequired())) {
        status = QuotationStatus.PROCESSING;
      }
    }
    if (status === QuotationStatus.PROCESSING) {
      if (!(await director.isManualProposalRequired())) {
        status = QuotationStatus.PROPOSED;
      }
    }
    return status;
  },
  async submitRequest(quotationContext) {
    const director = this.director();
    await director.submit(quotationContext);
    return this;
  },
  async verifyRequest(quotationContext) {
    const director = this.director();
    await director.verify(quotationContext);
    return this;
  },
  async buildProposal(quotationContext) {
    const director = this.director();
    const proposal = await director.quote(quotationContext);
    return Quotations.updateProposal({
      ...proposal,
      quotationId: this._id
    });
  },
  director() {
    const director = new QuotationDirector(this);
    return director;
  },
  async setStatus(status, info) {
    return Quotations.updateStatus({
      quotationId: this._id,
      status,
      info
    });
  },
  async addDocument(objOrString, meta, options = {}) {
    if (typeof objOrString === 'string' || objOrString instanceof String) {
      return QuotationDocuments.insertWithRemoteURL({
        url: objOrString,
        ...options,
        meta: {
          quotationId: this._id,
          ...meta
        }
      });
    }
    const { rawFile, userId } = objOrString;
    return QuotationDocuments.insertWithRemoteBuffer({
      file: rawFile,
      userId,
      ...options,
      meta: {
        quotationId: this._id,
        ...meta
      }
    });
  },
  documents(options) {
    const { type } = options || {};
    const selector = { 'meta.quotationId': this._id };
    if (type) {
      selector['meta.type'] = type;
    }
    return QuotationDocuments.find(selector, {
      sort: { 'meta.date': -1 }
    }).each();
  },
  document(options) {
    const { type } = options || {};
    const selector = { 'meta.quotationId': this._id };
    if (type) {
      selector['meta.type'] = type;
    }
    return QuotationDocuments.findOne(selector, { sort: { 'meta.date': -1 } });
  },
  logs({ limit, offset }) {
    const selector = { 'meta.quotationId': this._id };
    const logs = Logs.find(selector, {
      skip: offset,
      limit,
      sort: {
        created: -1
      }
    }).fetch();
    return logs;
  },
  isProposalValid() {
    return this.status === QuotationStatus.PROPOSED && !this.isExpired();
  },
  isExpired(referenceDate) {
    const now = new Date() || referenceDate;
    const expiryDate = new Date(this.expires);
    const isExpired = now.getTime() > expiryDate.getTime();
    return isExpired;
  }
});

Quotations.requestQuotation = async (
  { productId, userId, currencyCode, configuration },
  options
) => {
  log('Create Quotation', { userId });
  const quotationId = Quotations.insert({
    created: new Date(),
    status: QuotationStatus.REQUESTED,
    userId,
    productId,
    configuration,
    currency: Countries.resolveDefaultCurrencyCode({
      isoCode: currencyCode
    }),
    countryCode: currencyCode
  });
  const quotation = Quotations.findOne({ _id: quotationId });
  return quotation.process().sendStatusToCustomer(options);
};

Quotations.updateContext = ({ context, quotationId }) => {
  log('Update Arbitrary Context', { quotationId });
  Quotations.update(
    { _id: quotationId },
    {
      $set: {
        context,
        updated: new Date()
      }
    }
  );
  return Quotations.findOne({ _id: quotationId });
};

Quotations.updateProposal = ({ price, expires, meta, quotationId }) => {
  log('Update Quotation with Proposal', { quotationId });
  Quotations.update(
    { _id: quotationId },
    {
      $set: {
        price,
        expires,
        meta,
        updated: new Date()
      }
    }
  );
  return Quotations.findOne({ _id: quotationId });
};

Quotations.newQuotationNumber = () => {
  let quotationNumber = null;
  const hashids = new Hashids(
    'unchained',
    6,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
  );
  while (!quotationNumber) {
    const randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
    const newHashID = hashids.encode(randomNumber);
    if (
      Quotations.find({ quotationNumber: newHashID }, { limit: 1 }).count() ===
      0
    ) {
      quotationNumber = newHashID;
    }
  }
  return quotationNumber;
};

Quotations.updateStatus = async ({ status, quotationId, info = '' }) => {
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
        info
      }
    }
  };
  switch (status) {
    // explicitly use fallthrough here!
    case QuotationStatus.FULLFILLED:
      if (!quotation.fullfilled) {
        modifier.$set.fullfilled = date;
      }
      modifier.$set.expires = new Date();
    case QuotationStatus.PROPOSED: // eslint-disable-line no-fallthrough
      isShouldUpdateDocuments = true;
    case QuotationStatus.PROCESSING: // eslint-disable-line no-fallthrough
      if (!quotation.quotationNumber) {
        modifier.$set.quotationNumber = Quotations.newQuotationNumber();
      }
      break;
    case QuotationStatus.REJECTED:
      modifier.$set.expires = new Date();
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
      await QuotationDocuments.updateDocuments({
        quotationId,
        date,
        ...modifier.$set
      });
    } catch (e) {
      log(e, { level: 'error' });
    }
  }
  log(`New Status: ${status}`, { quotationId });
  Quotations.update({ _id: quotationId }, modifier);
  return Quotations.findOne({ _id: quotationId });
};
