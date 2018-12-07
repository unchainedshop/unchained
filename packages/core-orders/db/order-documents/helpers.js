import 'meteor/dburles:collection-helpers';
import { log } from 'meteor/unchained:core-logger';
import { DocumentDirector } from 'meteor/unchained:core-documents';
import { OrderDocuments } from './collections';
import { OrderDocumentTypes } from './schema';
import { Orders } from '../orders/collections';
import { OrderDeliveries } from '../order-deliveries/collections';
import { OrderPayments } from '../order-payments/collections';

class OrderDocumentDirector extends DocumentDirector {
  constructor(context) {
    const documents = context && context.order && context.order.documents();
    super({ documents, ...context });
  }

  resolveOrderNumber(options) {
    const orderNumber = (options && options.orderNumber) || this.context.order.orderNumber;
    log(`DocumentDirector -> OrderNumber resolved: ${orderNumber}`);
    return orderNumber;
  }

  buildOrderConfirmation(options) {
    const orderNumber = this.resolveOrderNumber(options);
    if (!orderNumber) return;
    this.execute('buildOrderConfirmation', { orderNumber, ...options }).forEach((doc) => {
      if (doc) {
        const { date } = options;
        const { file, meta, ...rest } = doc;
        this.context.order.addDocument(file, {
          date,
          type: OrderDocumentTypes.ORDER_CONFIRMATION,
          ...meta,
        }, rest);
      }
    });
  }

  buildDeliveryNote(options) {
    const orderNumber = this.resolveOrderNumber(options);
    if (!orderNumber) return;
    this.execute('buildDeliveryNote', { orderNumber, ...options }).forEach((doc) => {
      if (doc) {
        const { date, delivery } = options;
        const { file, meta, ...rest } = doc;
        this.context.order.addDocument(file, {
          date,
          type: OrderDocumentTypes.DELIVERY_NOTE,
          deliveryId: delivery._id,
          status: delivery.status,
          ...meta,
        }, rest);
      }
    });
  }

  buildInvoice(options) {
    const orderNumber = this.resolveOrderNumber(options);
    if (!orderNumber) return;
    this.execute('buildInvoiceAndReceipt', { orderNumber, ...options }).forEach((files) => {
      if (files) {
        const { date, payment } = options;
        const { file: invoice, meta, ...rest } = files[0];
        this.context.order.addDocument(invoice, {
          date,
          type: OrderDocumentTypes.INVOICE,
          paymentId: payment._id,
          status: payment.status,
          ...meta,
        }, rest);
        const { file: receipt, meta: receiptMeta, ...receiptRest } = files[1];
        this.context.order.addDocument(receipt, {
          date,
          type: OrderDocumentTypes.RECEIPT,
          paymentId: payment._id,
          status: payment.status,
          ...receiptMeta,
        }, receiptRest);
      }
    });
  }

  updateDocuments({ date, status, ...overrideValues }) {
    if (!this.context.order || !date) return;
    const { order } = this.context;
    const payment = (this.context.payment || order.payment());
    const delivery = (this.context.delivery || order.delivery());

    if (this.context.payment) {
      payment.status = status;
    } else if (this.context.delivery) {
      delivery.status = status;
    } else {
      order.status = status;
    }
    if (!this.isDocumentExists({
      type: OrderDocumentTypes.ORDER_CONFIRMATION,
    })) {
      this.buildOrderConfirmation({
        date,
        status,
        ancestors: this.filteredDocuments(),
        ...overrideValues,
      });
    }

    if (!this.isDocumentExists({
      type: OrderDocumentTypes.DELIVERY_NOTE,
      status: delivery.status,
    })) {
      const deliveryProvider = delivery.provider();
      if (deliveryProvider) {
        this.buildDeliveryNote({
          date,
          delivery,
          ancestors: this.filteredDocuments({
            type: OrderDocumentTypes.DELIVERY_NOTE,
          }),
          ...overrideValues,
        });
      }
    }
    if (!this.isDocumentExists({
      type: OrderDocumentTypes.INVOICE,
      status: payment.status,
    })) {
      const paymentProvider = payment.provider();
      if (paymentProvider) {
        this.buildInvoice({
          date,
          payment,
          ancestors: this.filteredDocuments({
            type: OrderDocumentTypes.INVOICE,
          }),
          ...overrideValues,
        });
      }
    }
  }
}


OrderDocuments.updateDocuments = ({ orderId, ...rest }) => {
  const order = Orders.findOne({ _id: orderId });
  const director = new OrderDocumentDirector({ order });
  log('Update Order Documents', { orderId });
  director.updateDocuments({ ...rest });
};

OrderDocuments.updatePaymentDocuments = ({ paymentId, ...rest }) => {
  const payment = OrderPayments.findOne({ _id: paymentId });
  const order = Orders.findOne({ _id: payment.orderId });
  const director = new OrderDocumentDirector({ order, payment });
  log(`Payment ${paymentId} -> Update Payment Documents`, { orderId: payment.orderId });
  director.updateDocuments({ ...rest });
};

OrderDocuments.updateDeliveryDocuments = ({ deliveryId, ...rest }) => {
  const delivery = OrderDeliveries.findOne({ _id: deliveryId });
  const order = Orders.findOne({ _id: delivery.orderId });
  const director = new OrderDocumentDirector({ order, delivery });
  log(`Delivery ${deliveryId} -> Update Delivery Documents`, { orderId: delivery.orderId });
  director.updateDocuments({ ...rest });
};
