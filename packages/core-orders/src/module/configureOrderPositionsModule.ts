import { ModuleMutations } from '@unchainedshop/types/core.js';
import { OrdersModule } from '@unchainedshop/types/orders.js';
import { OrderPosition, OrderPositionsModule } from '@unchainedshop/types/orders.positions.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { log } from '@unchainedshop/logger';
import {
  generateDbFilterById,
  generateDbMutations,
  generateDbObjectId,
  mongodb,
} from '@unchainedshop/mongodb';
import { OrderPositionsSchema } from '../db/OrderPositionsSchema.js';
import { ordersSettings } from '../orders-settings.js';

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
  updateCalculation,
}: {
  OrderPositions: mongodb.Collection<OrderPosition>;
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderPositionsModule => {
  registerEvents(ORDER_POSITION_EVENTS);

  const mutations = generateDbMutations<OrderPosition>(OrderPositions, OrderPositionsSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<OrderPosition>;

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

    // Mutations

    create: async (
      { configuration, context, quantity, quotationId },
      { order, product, originalProduct },
      unchainedAPI,
    ) => {
      const orderId = order._id;
      const productId = product._id;
      const originalProductId = originalProduct ? originalProduct._id : undefined;

      log(
        `Create ${quantity}x Position with Product ${productId} ${
          quotationId ? ` (${quotationId})` : ''
        }`,
        { orderId, productId, originalProductId },
      );

      const positionId = await mutations.create({
        orderId,
        productId,
        originalProductId,
        quotationId,
        quantity,
        configuration,
        context,
        calculation: [],
        scheduling: [],
      });

      await updateCalculation(orderId, unchainedAPI);

      return OrderPositions.findOne(buildFindByIdSelector(positionId));
    },

    delete: async (orderPositionId, unchainedAPI) => {
      const selector = buildFindByIdSelector(orderPositionId);
      const orderPosition = await OrderPositions.findOne(selector, {});

      log(`Remove Position ${orderPositionId}`, {
        orderId: orderPosition.orderId,
      });

      await OrderPositions.deleteOne(selector);

      await updateCalculation(orderPosition.orderId, unchainedAPI);

      await emit('ORDER_REMOVE_CART_ITEM', {
        orderPosition,
      });

      return { ...orderPosition, calculation: [] };
    },

    removePositions: async ({ orderId }, unchainedAPI) => {
      log('Remove Positions', { orderId });

      const result = await OrderPositions.deleteMany({ orderId });

      await updateCalculation(orderId, unchainedAPI);

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

      await OrderPositions.updateOne(selector, modifier);

      await updateCalculation(order._id, unchainedAPI);

      const updatedOrderPosition = await OrderPositions.findOne(selector, {});

      await emit('ORDER_UPDATE_CART_ITEM', {
        orderPosition: updatedOrderPosition,
      });

      return updatedOrderPosition;
    },

    removeProductByIdFromAllOpenPositions: async (productId, unchainedAPI) => {
      log('Remove Position Product', { productId });

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
      const result = await OrderPositions.deleteMany({ _id: { $in: positionIds } });

      const orderIdsToRecalculate = positions.map((o) => o.orderId);
      await Promise.all(
        [...new Set(orderIdsToRecalculate)].map(async (orderIdToRecalculate) => {
          await updateCalculation(orderIdToRecalculate, unchainedAPI);
        }),
      );

      await Promise.all(
        positions.map(async (orderPosition) => {
          await emit('ORDER_REMOVE_CART_ITEM', {
            orderPosition,
          });
        }),
      );

      return result.deletedCount;
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
      log(`OrderPosition ${orderPosition._id} -> Update Calculation`, {
        orderId: orderPosition.orderId,
      });

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

      await updateCalculation(orderId, unchainedAPI);

      const upsertedOrderPosition = await OrderPositions.findOne(selector);

      await emit('ORDER_ADD_PRODUCT', { orderPosition: upsertedOrderPosition });

      return upsertedOrderPosition;
    },
  };
};
