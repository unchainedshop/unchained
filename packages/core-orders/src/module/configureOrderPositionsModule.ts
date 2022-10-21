import { Collection, Filter, Query } from '@unchainedshop/types/common';
import { ModuleMutations } from '@unchainedshop/types/core';
import { OrdersModule } from '@unchainedshop/types/orders';
import { OrderPosition, OrderPositionsModule } from '@unchainedshop/types/orders.positions';
import { emit, registerEvents } from '@unchainedshop/events';
import { log } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations, generateDbObjectId } from '@unchainedshop/utils';
import { OrderPositionsSchema } from '../db/OrderPositionsSchema';
import { ordersSettings } from '../orders-settings';

const ORDER_POSITION_EVENTS: string[] = [
  'ORDER_UPDATE_CART_ITEM',
  'ORDER_REMOVE_CART_ITEM',
  'ORDER_EMPTY_CART',
  'ORDER_ADD_PRODUCT',
];

const buildFindByIdSelector = (orderPositionId: string, orderId?: string) =>
  generateDbFilterById(orderPositionId, orderId ? { orderId } : undefined) as Filter<OrderPosition>;

export const configureOrderPositionsModule = ({
  OrderPositions,
  updateCalculation,
}: {
  OrderPositions: Collection<OrderPosition>;
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
    discounts: (orderPosition, { order, orderDiscount }, requestContext) => {
      const pricingSheet = requestContext.modules.orders.positions.pricingSheet(
        orderPosition,
        order.currency,
        requestContext,
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
      requestContext,
    ) => {
      const orderId = order._id;
      const productId = product._id;
      const originalProductId = originalProduct ? originalProduct._id : undefined;

      log(
        `Create ${quantity}x Position with Product ${productId} ${
          quotationId ? ` (${quotationId})` : ''
        }`,
        { orderId, productId, originalProductId, userId: requestContext.userId },
      );

      const positionId = await mutations.create(
        {
          orderId,
          productId,
          originalProductId,
          quotationId,
          quantity,
          configuration,
          context,
          calculation: [],
          scheduling: [],
        },
        requestContext.userId,
      );

      await updateCalculation(orderId, requestContext);

      return OrderPositions.findOne(buildFindByIdSelector(positionId));
    },

    delete: async (orderPositionId, requestContext) => {
      const selector = buildFindByIdSelector(orderPositionId);
      const orderPosition = await OrderPositions.findOne(selector, {});

      log(`Remove Position ${orderPositionId}`, {
        orderId: orderPosition.orderId,
      });

      await OrderPositions.deleteOne(selector);

      await updateCalculation(orderPosition.orderId, requestContext);

      emit('ORDER_REMOVE_CART_ITEM', {
        orderPosition,
      });

      return { ...orderPosition, calculation: [] };
    },

    removePositions: async ({ orderId }, requestContext) => {
      log('Remove Positions', { orderId });

      const result = await OrderPositions.deleteMany({ orderId });

      await updateCalculation(orderId, requestContext);

      emit('ORDER_EMPTY_CART', { orderId, count: result.deletedCount });

      return result.deletedCount;
    },

    updateProductItem: async (
      { quantity, configuration },
      { order, product, orderPosition },
      requestContext,
    ) => {
      const selector = buildFindByIdSelector(orderPosition._id, order._id);
      const modifier: any = {
        $set: {
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      };

      if (quantity !== null && quantity !== orderPosition.quantity) {
        modifier.$set.quantity = quantity;
      }

      if (configuration !== null) {
        const resolvedProduct = await requestContext.modules.products.resolveOrderableProduct(
          product,
          { configuration },
          requestContext,
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
        requestContext,
      );

      await OrderPositions.updateOne(selector, modifier);

      await updateCalculation(order._id, requestContext);

      const updatedOrderPosition = await OrderPositions.findOne(selector, {});

      emit('ORDER_UPDATE_CART_ITEM', {
        orderPosition: updatedOrderPosition,
      });

      return updatedOrderPosition;
    },

    updateScheduling: async ({ order, orderDelivery, orderPosition }, requestContext) => {
      const { modules } = requestContext;
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
            requestContext,
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
          const dispatch = await requestContext.modules.warehousing.estimatedDispatch(
            warehousingProvider,
            context,
            requestContext,
          );

          return {
            warehousingProviderId: warehousingProvider._id,
            ...dispatch,
          };
        }),
      );

      await OrderPositions.updateOne(generateDbFilterById(orderPosition._id), {
        $set: { scheduling },
      });

      return OrderPositions.findOne(generateDbFilterById(orderPosition._id), {});
    },

    updateCalculation: async (orderPosition, requestContext) => {
      log(`OrderPosition ${orderPosition._id} -> Update Calculation`, {
        orderId: orderPosition.orderId,
      });

      const calculation = await requestContext.modules.products.calculate(
        { item: orderPosition, configuration: orderPosition.configuration },
        requestContext,
      );
      const selector = buildFindByIdSelector(orderPosition._id);

      await OrderPositions.updateOne(selector, {
        $set: { calculation },
      });

      return OrderPositions.findOne(selector, {});
    },

    addProductItem: async (orderPosition: OrderPosition, { order, product }, requestContext) => {
      const { modules } = requestContext;
      const { configuration, orderId: positionOrderId, quantity, ...scope } = orderPosition;
      const orderId = order._id || positionOrderId;

      // Resolve product
      const resolvedProduct = await modules.products.resolveOrderableProduct(
        product,
        { configuration },
        requestContext,
      );

      // Validate add to cart mutation
      await ordersSettings.validateOrderPosition(
        {
          order,
          product,
          configuration,
          quantityDiff: quantity,
        },
        requestContext,
      );

      // Search for existing position
      const selector: Query = {
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
            updatedBy: requestContext.userId,
          },
          $inc: { quantity },
          $setOnInsert: {
            _id: generateDbObjectId(),
            created: new Date(),
            createdBy: requestContext.userId,
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

      await updateCalculation(orderId, requestContext);

      const upsertedOrderPosition = await OrderPositions.findOne(selector);

      emit('ORDER_ADD_PRODUCT', { orderPosition: upsertedOrderPosition });

      return upsertedOrderPosition;
    },
  };
};
