import 'meteor/dburles:collection-helpers';
import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import {
  PaymentPricingDirector,
  PaymentPricingSheet,
} from 'meteor/unchained:core-pricing';
import { emit } from 'meteor/unchained:core-events';
import { objectInvert } from 'meteor/unchained:utils';
import { OrderPayments } from './collections';
import { OrderPaymentStatus } from './schema';
import { Orders } from '../orders/collections';
import { OrderDocuments } from '../order-documents/collections';

OrderPayments.helpers({
  order() {
    return Orders.findOne({
      _id: this.orderId,
    });
  },
  provider() {
    return PaymentProviders.findProvider({
      paymentProviderId: this.paymentProviderId,
    });
  },
  transformedContextValue(key) {
    const provider = this.provider();
    if (provider) {
      return provider.transformContext(key, this.context[key]);
    }
    return JSON.stringify(this.context[key]);
  },
  normalizedStatus() {
    return objectInvert(OrderPaymentStatus)[this.status || null];
  },
  sign({ transactionContext }) {
    const result = this.provider().sign({
      transactionContext,
      orderPayment: this,
    });
    emit('ORDER_SIGN_PAYMENT', {
      payload: { orderPayment: this, transactionContext },
    });
    return result;
  },

  init() {
    const provider = this.provider();
    const context = provider.defaultContext();
    return this.updateContext(context);
  },
  updateContext(context) {
    return OrderPayments.updatePayment({
      paymentId: this._id,
      orderId: this.orderId,
      context,
    });
  },
  pricing() {
    const pricing = new PaymentPricingSheet({
      calculation: this.calculation,
      currency: this.order().currency,
    });
    return pricing;
  },
  isBlockingOrderConfirmation() {
    if (this.status === OrderPaymentStatus.PAID) return false;
    if (this.provider().isPayLaterAllowed()) return false;
    return true;
  },
  isBlockingOrderFullfillment() {
    if (this.status === OrderPaymentStatus.PAID) return false;
    return true;
  },
  charge(paymentContext, order) {
    if (this.status !== OrderPaymentStatus.OPEN) return;
    const provider = this.provider();
    const arbitraryResponseData = provider.charge(
      {
        transactionContext: {
          ...(paymentContext || {}),
          ...this.context,
        },
        order,
      },
      order.userId
    );
    if (arbitraryResponseData) {
      this.setStatus(
        OrderPaymentStatus.PAID,
        JSON.stringify(arbitraryResponseData)
      );
    }
  },
  markPaid(arbitraryResponseData) {
    if (this.status !== OrderPaymentStatus.OPEN) return;
    this.setStatus(
      OrderPaymentStatus.PAID,
      arbitraryResponseData
        ? JSON.stringify(arbitraryResponseData)
        : 'mark paid manually'
    );
  },
  setStatus(status, info) {
    return OrderPayments.updateStatus({
      paymentId: this._id,
      info,
      status,
    });
  },
  discounts(orderDiscountId) {
    return this.pricing()
      .discountPrices(orderDiscountId)
      .map((discount) => ({
        payment: this,
        ...discount,
      }));
  },
  updateCalculation() {
    log(`OrderPayment ${this._id} -> Update Calculation`, {
      orderId: this.orderId,
    });
    const pricing = new PaymentPricingDirector({ item: this });
    const calculation = pricing.calculate();
    return OrderPayments.update(
      { _id: this._id },
      { $set: { calculation, updated: new Date() } }
    );
  },
});

OrderPayments.createOrderPayment = ({
  orderId,
  paymentProviderId,
  ...rest
}) => {
  log(`Create OrderPayment with Provider ${paymentProviderId}`, { orderId });
  const orderPaymentId = OrderPayments.insert({
    ...rest,
    created: new Date(),
    status: OrderPaymentStatus.OPEN,
    orderId,
    paymentProviderId,
  });
  const orderPayment = OrderPayments.findOne({ _id: orderPaymentId });
  return orderPayment.init();
};

OrderPayments.updatePayment = ({ orderId, paymentId, context }) => {
  log(`OrderPayment ${paymentId} -> Update Context`, { orderId });
  OrderPayments.update(
    { _id: paymentId },
    {
      $set: { context, updated: new Date() },
    }
  );
  Orders.updateCalculation({ orderId });
  const orderPayment = OrderPayments.findOne({ _id: paymentId });
  emit('ORDER_UPDATE_PAYMENT', { payload: orderPayment });
  return orderPayment;
};

OrderPayments.logEvent = ({ paymentId, event }) => {
  const date = new Date();
  const modifier = {
    $push: {
      log: {
        date,
        status: undefined,
        info: JSON.stringify(event),
      },
    },
  };
  OrderPayments.update({ _id: paymentId }, modifier);
};

OrderPayments.updateStatus = ({ paymentId, status, info = '' }) => {
  log(`OrderPayment ${paymentId} -> New Status: ${status}`);
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
  if (status === OrderPaymentStatus.PAID) {
    modifier.$set.paid = date;
  }
  OrderDocuments.updatePaymentDocuments({ paymentId, date, ...modifier.$set });
  OrderPayments.update({ _id: paymentId }, modifier);
  return OrderPayments.findOne({ _id: paymentId });
};

OrderPayments.findPayment = ({ orderPaymentId }, options) => {
  return OrderPayments.findOne({ _id: orderPaymentId }, options);
};
