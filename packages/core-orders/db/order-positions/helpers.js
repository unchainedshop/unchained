import 'meteor/dburles:collection-helpers';
import { log } from 'meteor/unchained:core-logger';
import {
  ProductPricingDirector,
  ProductPricingSheet
} from 'meteor/unchained:core-pricing';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { Products } from 'meteor/unchained:core-products';
import { Quotations } from 'meteor/unchained:core-quotations';
import { OrderPositions } from './collections';
import { Orders } from '../orders/collections';
import { OrderDiscounts } from '../order-discounts/collections';

OrderPositions.helpers({
  product() {
    return Products.findOne({
      _id: this.productId
    });
  },
  order() {
    return Orders.findOne({
      _id: this.orderId
    });
  },
  originalProduct() {
    return (
      Products.findOne({
        _id: this.originalProductId
      }) || this.product()
    );
  },
  quotation() {
    return Quotations.findOne({
      _id: this.quotationId
    });
  },
  pricing() {
    return new ProductPricingSheet({
      calculation: this.calculation,
      currency: this.order().currency,
      quantity: this.quantity
    });
  },
  discounts() {
    return this.pricing()
      .discountPrices()
      .map(discount => ({
        item: this,
        ...discount
      }));
  },
  validationErrors() {
    const errors = [];
    log(`OrderPosition ${this._id} -> Validate ${this.quantity}`);
    if (!this.product().isActive())
      errors.push(new Error('This product is not available anymore'));
    if (this.quotationId && !this.quotation().isProposalValid())
      errors.push(
        new Error('Quotation expired or fullfiled, please request a new offer')
      );
  },
  reserve() {
    if (this.quotationId)
      this.quotation().fullfill({ info: { orderPositionId: this._id } });
    log(`OrderPosition ${this._id} -> Reserve ${this.quantity}`);
  },
  dispatches() {
    const scheduling = this.scheduling || [];
    const order = this.order();
    const { countryCode, userId } = order;
    return scheduling.map(schedule => {
      const context = {
        warehousingProvider: WarehousingProviders.findProviderById(
          schedule.warehousingProviderId
        ),
        deliveryProvider: order.delivery().provider(),
        product: this.product(),
        quantity: this.quantity,
        country: countryCode,
        userId
        // referenceDate,
      };
      return {
        ...context,
        ...schedule
      };
    });
  },
  config(key) {
    return (this.configuration || []).reduce(
      (accumulator, configurationItem) => {
        if (configurationItem.key === key) return configurationItem.value;
        return accumulator;
      },
      undefined
    );
  }
});

OrderPositions.upsertPosition = ({
  orderId,
  quantity,
  configuration,
  context,
  ...scope
}) => {
  const existingPosition = OrderPositions.findOne({
    orderId,
    configuration: configuration || {
      $exists: false
    },
    ...scope
  });
  if (existingPosition) {
    return OrderPositions.updatePosition(
      {
        orderId,
        positionId: existingPosition._id
      },
      {
        quantity: existingPosition.quantity + quantity
      }
    );
  }
  return OrderPositions.createPosition({
    orderId,
    quantity,
    configuration,
    context,
    ...scope
  });
};

OrderPositions.createPosition = ({
  orderId,
  productId,
  originalProductId,
  quotationId,
  quantity,
  configuration,
  ...rest
}) => {
  log(
    `Create ${quantity}x Position with Product ${productId} ${
      quotationId ? ` (${quotationId})` : ''
    }`,
    { orderId }
  );
  const positionId = OrderPositions.insert({
    ...rest,
    orderId,
    productId,
    originalProductId,
    quotationId,
    quantity,
    configuration,
    created: new Date()
  });
  OrderDiscounts.updateDiscounts({ orderId });
  OrderPositions.updateCalculation({ orderId, positionId });
  Orders.updateCalculation({ orderId });
  return OrderPositions.findOne({
    _id: positionId
  });
};

OrderPositions.updatePosition = (
  { orderId, positionId },
  { quantity = null, configuration = null }
) => {
  const orderPosition = OrderPositions.findOne({
    orderId,
    _id: positionId
  });

  if (quantity !== null) {
    log(
      `OrderPosition ${positionId} -> Update Quantity of ${positionId} to ${quantity}x`,
      { orderId }
    );

    OrderPositions.update(
      { orderId, _id: positionId },
      {
        $set: {
          quantity,
          updated: new Date()
        }
      }
    );
  }
  if (configuration !== null) {
    log(
      `OrderPosition ${positionId} -> Update confiugration of ${positionId} to ${JSON.stringify(
        configuration
      )}x`,
      { orderId }
    );
    // check if the variant has changed
    const originalProduct = orderPosition.originalProduct();
    if (originalProduct) {
      const resolvedProduct = originalProduct.resolveOrderableProduct({
        quantity,
        configuration
      });
      OrderPositions.update(
        { orderId, _id: positionId },
        {
          $set: {
            productId: resolvedProduct._id,
            updated: new Date()
          }
        }
      );
    }

    OrderPositions.update(
      { orderId, _id: positionId },
      {
        $set: {
          configuration,
          updated: new Date()
        }
      }
    );
  }
  OrderDiscounts.updateDiscounts({ orderId });
  OrderPositions.updateCalculation({ orderId, positionId });
  Orders.updateCalculation({ orderId });
  return OrderPositions.findOne({
    _id: positionId
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

OrderPositions.removePositions = ({ orderId }) => {
  log('Remove Positions', { orderId });
  const count = OrderPositions.remove({ orderId });
  OrderDiscounts.updateDiscounts({ orderId });
  Orders.updateCalculation({ orderId });
  return count;
};

OrderPositions.updateCalculation = ({ positionId }) => {
  const position = OrderPositions.findOne({ _id: positionId });
  log(`OrderPosition ${positionId} -> Update Calculation`, {
    orderId: position.orderId
  });
  const pricing = new ProductPricingDirector({ item: position });
  const calculation = pricing.calculate();
  return OrderPositions.update(
    { _id: positionId },
    {
      $set: { calculation }
    }
  );
};

OrderPositions.updateScheduling = ({ positionId, position }) => {
  const item = position || OrderPositions.findOne({ _id: positionId });
  log(`OrderPosition ${item._id} -> Update Scheduling`, {
    orderId: position.orderId
  });
  // scheduling (store in db for auditing)
  const order = item.order();
  const delivery = order.delivery();
  const product = item.product();
  const deliveryProvider = delivery && delivery.provider();
  const { countryCode, userId } = order;
  const scheduling = WarehousingProviders.findSupported({
    product,
    deliveryProvider
  }).map(warehousingProvider => {
    const context = {
      warehousingProvider,
      deliveryProvider,
      product,
      item,
      delivery,
      order,
      userId,
      country: countryCode,
      referenceDate: order.ordered,
      quantity: item.quantity
    };
    const dispatch = warehousingProvider.estimatedDispatch(context);
    return {
      warehousingProviderId: warehousingProvider._id,
      ...dispatch
    };
  });
  return OrderPositions.update(
    { _id: item._id },
    {
      $set: { scheduling }
    }
  );
};
