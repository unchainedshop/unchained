import 'meteor/dburles:collection-helpers';
import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import {
  DeliveryPricingDirector,
  DeliveryPricingSheet,
} from 'meteor/unchained:core-pricing';
import { objectInvert } from 'meteor/unchained:utils';
import { emit } from 'meteor/unchained:core-events';
import { OrderDeliveries } from './collections';
import { OrderDeliveryStatus } from './schema';
import { Orders } from '../orders/collections';
import { OrderDocuments } from '../order-documents/collections';

OrderDeliveries.helpers({
  order() {
    return Orders.findOne({
      _id: this.orderId,
    });
  },
  provider() {
    return DeliveryProviders.findProvider({
      deliveryProviderId: this.deliveryProviderId,
    });
  },
  transformedContextValue(key) {
    const provider = this.provider();
    const ctx = this.context || {};
    if (provider) {
      return provider.transformContext(key, ctx[key]);
    }
    return JSON.stringify(ctx[key]);
  },
  normalizedStatus() {
    return objectInvert(OrderDeliveryStatus)[this.status || null];
  },
  init() {
    const provider = this.provider();
    const context = provider.defaultContext();
    return this.updateContext(context);
  },
  updateContext(context) {
    return OrderDeliveries.updateDelivery({
      deliveryId: this._id,
      orderId: this.orderId,
      context,
    });
  },
  pricing() {
    const pricing = new DeliveryPricingSheet({
      calculation: this.calculation,
      currency: this.order().currency,
    });
    return pricing;
  },
  isBlockingOrderConfirmation() {
    if (this.provider().isAutoReleaseAllowed()) return false;
    return true;
  },
  isBlockingOrderFullfillment() {
    if (this.status === OrderDeliveryStatus.DELIVERED) return false;
    return true;
  },
  send(deliveryContext, order) {
    if (this.status !== OrderDeliveryStatus.OPEN) return;
    const provider = this.provider();
    const address =
      this.context?.address || (order || this.order()).billingAddress || {};
    const arbitraryResponseData = provider.send({
      transactionContext: {
        ...(deliveryContext || {}),
        ...(this.context || {}),
        address,
      },
      order,
    });
    if (arbitraryResponseData) {
      this.setStatus(
        OrderDeliveryStatus.DELIVERED,
        JSON.stringify(arbitraryResponseData)
      );
    }
  },
  markDelivered() {
    if (this.status !== OrderDeliveryStatus.OPEN) return;
    this.setStatus(OrderDeliveryStatus.DELIVERED, 'mark delivered manually');
    emit('ORDER_DELIVER', { orderDelivery: this });
  },
  setStatus(status, info) {
    return OrderDeliveries.updateStatus({
      deliveryId: this._id,
      info,
      status,
    });
  },
  discounts(orderDiscountId) {
    return this.pricing()
      .discountPrices(orderDiscountId)
      .map((discount) => ({
        delivery: this,
        ...discount,
      }));
  },
  updateCalculation() {
    log(`OrderDelivery ${this._id} -> Update Calculation`, {
      orderId: this.orderId,
    });
    const pricing = new DeliveryPricingDirector({ item: this });
    const calculation = pricing.calculate();
    return OrderDeliveries.update(
      { _id: this._id },
      {
        $set: { updated: new Date(), calculation },
      }
    );
  },
});

OrderDeliveries.createOrderDelivery = ({
  orderId,
  deliveryProviderId,
  ...rest
}) => {
  log(`Create OrderDelivery with Provider ${deliveryProviderId}`, { orderId });
  const orderDeliveryId = OrderDeliveries.insert({
    ...rest,
    created: new Date(),
    status: OrderDeliveryStatus.OPEN,
    orderId,
    deliveryProviderId,
  });
  const orderDelivery = OrderDeliveries.findOne({ _id: orderDeliveryId });
  return orderDelivery.init();
};

OrderDeliveries.updateDelivery = ({ deliveryId, orderId, context }) => {
  log(`OrderDelivery ${deliveryId} -> Update Context`, { orderId });
  OrderDeliveries.update(
    { _id: deliveryId },
    {
      $set: { context: context || {}, updated: new Date() },
    }
  );
  Orders.updateCalculation({ orderId });
  const orderDelivery = OrderDeliveries.findOne({ _id: deliveryId });
  emit('ORDER_UPDATE_DELIVERY', { orderDelivery });
  return orderDelivery;
};

OrderDeliveries.updateStatus = ({ deliveryId, status, info = '' }) => {
  log(`OrderDelivery ${deliveryId} -> New Status: ${status}`);
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
  if (status === OrderDeliveryStatus.DELIVERED) {
    modifier.$set.delivered = date;
  }
  OrderDocuments.updateDeliveryDocuments({
    deliveryId,
    date,
    ...modifier.$set,
  });
  OrderDeliveries.update({ _id: deliveryId }, modifier);
  return OrderDeliveries.findOne({ _id: deliveryId });
};

OrderDeliveries.findDelivery = ({ orderDeliveryId }, options) => {
  return OrderDeliveries.findOne({ _id: orderDeliveryId }, options);
};
