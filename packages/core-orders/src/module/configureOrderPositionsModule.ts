import type { OrderDiscount } from '@unchainedshop/core-orders';
import type { UnchainedCore } from '@unchainedshop/core';
import { IProductPricingSheet, Product } from '@unchainedshop/core-products';

import { Order, OrderPosition } from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { ordersSettings } from '../orders-settings.js';
import { OrderDelivery } from '@unchainedshop/core-orders';
import { OrderPricingDiscount } from '../director/OrderPricingDirector.js';

export type OrderPositionsModule = {
  // Queries
  findOrderPosition: (
    params: { itemId: string },
    options?: mongodb.FindOptions,
  ) => Promise<OrderPosition>;
  findOrderPositions: (params: { orderId: string }) => Promise<Array<OrderPosition>>;

  // Transformations
  discounts: (
    orderPosition: OrderPosition,
    params: { order: Order; orderDiscount: OrderDiscount },
    unchainedAPI: UnchainedCore,
  ) => Array<OrderPricingDiscount>;

  pricingSheet: (
    orderPosition: OrderPosition,
    currency: string,
    unchainedAPI: UnchainedCore,
  ) => IProductPricingSheet;

  delete: (orderPositionId: string) => Promise<OrderPosition>;

  removePositions: ({ orderId }: { orderId: string }) => Promise<number>;
  removeProductByIdFromAllOpenPositions: (productId: string) => Promise<Array<string>>;

  updateProductItem: (
    doc: {
      context?: any;
      configuration?: Array<{ key: string; value: string }>;
      quantity?: number;
    },
    params: { order: Order; product: Product; orderPosition: OrderPosition },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPosition>;

  updateScheduling: (
    params: {
      order: Order;
      orderDelivery: OrderDelivery;
      orderPosition: OrderPosition;
    },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPosition>;

  updateCalculation: (
    orderPosition: OrderPosition,
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPosition>;

  addProductItem: (
    doc: {
      context?: any;
      configuration?: Array<{ key: string; value: string }>;
      orderId?: string;
      originalProductId?: string;
      productId?: string;
      quantity: number;
      quotationId?: string;
    },
    params: { order: Order; product: Product },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPosition>;
};

const ORDER_POSITION_EVENTS: string[] = [
  'ORDER_UPDATE_CART_ITEM',
  'ORDER_REMOVE_CART_ITEM',
  'ORDER_EMPTY_CART',
  'ORDER_ADD_PRODUCT',
];

export const buildFindByIdSelector = (orderPositionId: string, orderId?: string) =>
  generateDbFilterById(
    orderPositionId,
    orderId ? { orderId } : undefined,
  ) as mongodb.Filter<OrderPosition>;

export const configureOrderPositionsModule = ({
  OrderPositions,
}: {
  OrderPositions: mongodb.Collection<OrderPosition>;
}): OrderPositionsModule => {
  registerEvents(ORDER_POSITION_EVENTS);

  return {
    // Queries
    findOrderPosition: async ({ itemId }, options) => {
      return OrderPositions.findOne(buildFindByIdSelector(itemId), options);
    },

    findOrderPositions: async ({ orderId }) => {
      const positions = OrderPositions.find({ orderId, quantity: { $gt: 0 } });
      return positions.toArray();
    },

    // Transformations
    discounts: (orderPosition, { order, orderDiscount }, unchainedAPI) => {
      const pricingSheet = unchainedAPI.modules.orders.positions.pricingSheet(
        orderPosition,
        order.currency,
        unchainedAPI,
      );

      return pricingSheet.discountPrices(orderDiscount._id).map((discount) => ({
        item: orderPosition,
        ...discount,
      }));
    },

    pricingSheet: (orderPosition, currency, { modules }) => {
      return modules.products.pricingSheet({
        calculation: orderPosition.calculation,
        currency,
        quantity: orderPosition.quantity,
      });
    },

    delete: async (orderPositionId) => {
      const selector = buildFindByIdSelector(orderPositionId);
      const orderPosition = await OrderPositions.findOneAndDelete(selector, {});
      await emit('ORDER_REMOVE_CART_ITEM', {
        orderPosition,
      });
      return { ...orderPosition, calculation: [] };
    },

    removePositions: async ({ orderId }) => {
      const result = await OrderPositions.deleteMany({ orderId });
      await emit('ORDER_EMPTY_CART', { orderId, count: result.deletedCount });
      return result.deletedCount;
    },

    updateProductItem: async (
      { quantity, configuration },
      { order, product, orderPosition },
      unchainedAPI,
    ) => {
      const selector = buildFindByIdSelector(orderPosition._id, order._id);
      const modifier: any = {
        $set: {
          updated: new Date(),
        },
      };

      if (quantity !== null && quantity !== orderPosition.quantity) {
        modifier.$set.quantity = quantity;
      }

      if (configuration !== null) {
        const resolvedProduct = await unchainedAPI.modules.products.resolveOrderableProduct(
          product,
          { configuration },
          unchainedAPI,
        );
        modifier.$set.productId = resolvedProduct._id;
        modifier.$set.configuration = configuration;
      }

      await ordersSettings.validateOrderPosition(
        {
          order,
          product,
          configuration,
          quantityDiff: quantity - orderPosition.quantity,
        },
        unchainedAPI,
      );

      const updatedOrderPosition = await OrderPositions.findOneAndUpdate(selector, modifier, {
        returnDocument: 'after',
      });

      await emit('ORDER_UPDATE_CART_ITEM', {
        orderPosition: updatedOrderPosition,
      });

      return updatedOrderPosition;
    },

    removeProductByIdFromAllOpenPositions: async (productId) => {
      const positions = await OrderPositions.aggregate([
        {
          $match: {
            productId,
          },
        },
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order',
          },
        },
        {
          $match: {
            'order.status': null,
          },
        },
      ]).toArray();

      const positionIds = positions.map((o) => o._id);
      await OrderPositions.deleteMany({ _id: { $in: positionIds } });
      await Promise.all(
        positions.map(async (orderPosition) => {
          await emit('ORDER_REMOVE_CART_ITEM', {
            orderPosition,
          });
        }),
      );

      const orderIdsToRecalculate = positions.map((o) => o.orderId);
      return orderIdsToRecalculate;
    },

    updateScheduling: async ({ order, orderDelivery, orderPosition }, unchainedAPI) => {
      const { modules } = unchainedAPI;
      // scheduling (store in db for auditing)
      const product = await modules.products.findProduct({
        productId: orderPosition.productId,
      });
      const deliveryProvider =
        orderDelivery &&
        (await modules.delivery.findProvider({
          deliveryProviderId: orderDelivery.deliveryProviderId,
        }));
      const { countryCode, userId } = order;

      const scheduling = await Promise.all(
        (
          await modules.warehousing.findSupported(
            {
              product,
              deliveryProvider,
            },
            unchainedAPI,
          )
        ).map(async (warehousingProvider) => {
          const context = {
            warehousingProvider,
            deliveryProvider,
            product,
            item: orderPosition,
            delivery: deliveryProvider,
            order,
            userId,
            country: countryCode,
            referenceDate: order.ordered,
            quantity: orderPosition.quantity,
          };
          const dispatch = await unchainedAPI.modules.warehousing.estimatedDispatch(
            warehousingProvider,
            context,
            unchainedAPI,
          );

          return {
            warehousingProviderId: warehousingProvider._id,
            ...dispatch,
          };
        }),
      );

      return OrderPositions.findOneAndUpdate(
        generateDbFilterById(orderPosition._id),
        {
          $set: { scheduling },
        },
        {
          returnDocument: 'after',
        },
      );
    },

    updateCalculation: async (orderPosition, unchainedAPI) => {
      const calculation = await unchainedAPI.modules.products.calculate(
        { item: orderPosition, configuration: orderPosition.configuration },
        unchainedAPI,
      );
      return OrderPositions.findOneAndUpdate(
        buildFindByIdSelector(orderPosition._id),
        {
          $set: { calculation },
        },
        {
          returnDocument: 'after',
        },
      );
    },

    addProductItem: async (orderPosition: OrderPosition, { order, product }, unchainedAPI) => {
      const { modules } = unchainedAPI;
      const { configuration, orderId: positionOrderId, quantity, ...scope } = orderPosition;
      const orderId = order._id || positionOrderId;

      // Resolve product
      const resolvedProduct = await modules.products.resolveOrderableProduct(
        product,
        { configuration },
        unchainedAPI,
      );

      // Validate add to cart mutation
      await ordersSettings.validateOrderPosition(
        {
          order,
          product,
          configuration,
          quantityDiff: quantity,
        },
        unchainedAPI,
      );

      // Search for existing position
      const selector: mongodb.Filter<OrderPosition> = {
        orderId,
        productId: resolvedProduct._id,
        originalProductId: product._id,
        configuration: configuration || { $in: [null, undefined] },
        ...scope,
      };

      await OrderPositions.updateOne(
        selector,
        {
          $set: {
            updated: new Date(),
          },
          $inc: { quantity },
          $setOnInsert: {
            _id: generateDbObjectId(),
            created: new Date(),
            calculation: [],
            scheduling: [],
            orderId,
            productId: resolvedProduct._id,
            originalProductId: product._id,
            configuration,
            ...scope,
          },
        },
        { upsert: true },
      );

      const upsertedOrderPosition = await OrderPositions.findOne(selector);

      await emit('ORDER_ADD_PRODUCT', { orderPosition: upsertedOrderPosition });

      return upsertedOrderPosition;
    },
  };
};
