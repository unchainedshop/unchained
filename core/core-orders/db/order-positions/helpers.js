import 'meteor/dburles:collection-helpers';
import { log } from 'meteor/unchained:core-logger';
import { ProductPricingDirector, ProductPricingSheet } from 'meteor/unchained:core-pricing';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { Products } from 'meteor/unchained:core-products';
import { OrderPositions } from './collections';
import { Orders } from '../orders/collections';
import { OrderDiscounts } from '../order-discounts/collections';

OrderPositions.helpers({
  product() {
    return Products.findOne({
      _id: this.productId,
    });
  },
  order() {
    return Orders.findOne({
      _id: this.orderId,
    });
  },
  isEnforcesSingleItemsOnAddToOrder() {
    // return true to make addItem calls generate new positions even if there is already
    // a position with the same product
    return false;
  },
  pricing() {
    const pricing = new ProductPricingSheet({
      calculation: this.calculation,
      currency: this.order().currency,
      quantity: this.quantity,
    });
    return pricing;
  },
  discounts() {
    return this.pricing().discountPrices().map(discount => ({
      item: this,
      ...discount,
    }));
  },
  dispatches() {
    const scheduling = this.scheduling || [];
    const order = this.order();
    const { countryCode, userId } = order;
    return scheduling
      .map((schedule) => {
        const context = {
          warehousingProvider: WarehousingProviders
            .findOne({ _id: schedule.warehousingProviderId }),
          deliveryProvider: () => order.delivery().provider(),
          product: this.product,
          quantity: this.quantity,
          country: countryCode,
          userId,
        };
        return {
          ...context,
          ...schedule,
        };
      });
  },
});

OrderPositions.createPosition = ({
  orderId, productId, quantity, ...rest
}) => {
  log(`Create ${quantity}x Position with Product ${productId}`, { orderId });
  const positionId = OrderPositions.insert({
    ...rest,
    orderId,
    productId,
    quantity,
    created: new Date(),
  });
  OrderDiscounts.updateDiscounts({ orderId });
  OrderPositions.updateCalculation({ orderId, positionId });
  Orders.updateCalculation({ orderId });
  return OrderPositions.findOne({
    _id: positionId,
  });
};

OrderPositions.updatePosition = ({ positionId, orderId, quantity }) => {
  log(`OrderPosition ${positionId} -> Update Quantity of ${positionId} to ${quantity}x`, { orderId });
  OrderPositions.update({ orderId, _id: positionId }, {
    $set: {
      quantity,
      updated: new Date(),
    },
  });
  OrderDiscounts.updateDiscounts({ orderId });
  OrderPositions.updateCalculation({ orderId, positionId });
  Orders.updateCalculation({ orderId });
  return OrderPositions.findOne({
    _id: positionId,
  });
};

OrderPositions.removePosition = ({ positionId }) => {
  const position = OrderPositions.findOne({ _id: positionId });
  log(`Remove Position ${positionId}`, { orderId: position.orderId });
  OrderPositions.remove({ _id: positionId });
  OrderDiscounts.updateDiscounts({ orderId: position.orderId });
  Orders.updateCalculation({ orderId: position.orderId });
  return position;
};

OrderPositions.updateCalculation = ({ positionId }) => {
  const position = OrderPositions.findOne({ _id: positionId });
  log(`OrderPosition ${positionId} -> Update Calculation`, { orderId: position.orderId });
  const pricing = new ProductPricingDirector({ item: position });
  const calculation = pricing.calculate();
  return OrderPositions.update({ _id: positionId }, {
    $set: { calculation },
  });
};

OrderPositions.updateScheduling = ({ positionId, position }) => {
  const item = position || OrderPositions.findOne({ _id: positionId });
  log(`OrderPosition ${item._id} -> Update Scheduling`, { orderId: position.orderId });
  // scheduling (store in db for auditing)
  const order = item.order();
  const delivery = order.delivery();
  const product = item.product();

  const deliveryProvider = delivery && delivery.provider();
  const { countryCode, userId } = order;
  const scheduling = WarehousingProviders.findSupported({ product, deliveryProvider })
    .map((warehousingProvider) => {
      const context = {
        warehousingProvider,
        deliveryProvider,
        product,
        quantity: item.quantity,
        country: countryCode,
        userId,
        referenceDate: order.ordered || new Date(),
      };
      const dispatch = warehousingProvider.estimatedDispatch(context);
      return {
        warehousingProviderId: warehousingProvider._id,
        ...dispatch,
      };
    });
  return OrderPositions.update({ _id: item._id }, {
    $set: { scheduling },
  });
};
