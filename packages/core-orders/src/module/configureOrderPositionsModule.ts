import { Collection, Filter, ModuleMutations, Query } from '@unchainedshop/types/common';
import { OrdersModule } from '@unchainedshop/types/orders';
import { OrderPosition, OrderPositionsModule } from '@unchainedshop/types/orders.positions';
import { Product } from '@unchainedshop/types/products';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { OrderPositionsSchema } from '../db/OrderPositionsSchema';

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

  const mutations = generateDbMutations<OrderPosition>(
    OrderPositions,
    OrderPositionsSchema,
  ) as ModuleMutations<OrderPosition>;

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
      const orderPosition = await OrderPositions.findOne(selector);

      log(`Remove Position ${orderPositionId}`, {
        orderId: orderPosition.orderId,
      });

      await OrderPositions.deleteOne(selector);

      await updateCalculation(orderPosition.orderId, requestContext);

      emit('ORDER_REMOVE_CART_ITEM', {
        orderPosition,
      });

      return orderPosition;
    },

    removePositions: async ({ orderId }, requestContext) => {
      log('Remove Positions', { orderId });

      const result = await OrderPositions.deleteMany({ orderId });

      await updateCalculation(orderId, requestContext);

      emit('ORDER_EMPTY_CART', { orderId, count: result.deletedCount });

      return result.deletedCount;
    },

    update: async ({ orderId, orderPositionId }, { quantity, configuration }, requestContext) => {
      const selector = buildFindByIdSelector(orderPositionId, orderId);
      const orderPosition = await OrderPositions.findOne(selector);

      if (quantity !== null) {
        log(
          `OrderPosition ${orderPositionId} -> Update Quantity of ${orderPositionId} to ${quantity}x`,
          { orderId },
        );

        await OrderPositions.updateOne(selector, {
          $set: {
            quantity,
            updated: new Date(),
            updatedBy: requestContext.userId,
          },
        });
      }

      if (configuration !== null) {
        log(
          `OrderPosition ${orderPositionId} -> Update confiugration of ${orderPositionId} to ${JSON.stringify(
            configuration,
          )}x`,
          { orderId },
        );
        // check if the variant has changed
        let originalProduct: Product;
        if (orderPosition.originalProductId) {
          originalProduct = await requestContext.modules.products.findProduct({
            productId: orderPosition.originalProductId,
          });
        }
        if (!originalProduct) {
          originalProduct = await requestContext.modules.products.findProduct({
            productId: orderPosition.productId,
          });
        }

        if (originalProduct) {
          const resolvedProduct = await requestContext.modules.products.resolveOrderableProduct(
            originalProduct,
            { configuration },
            requestContext,
          );

          await OrderPositions.updateOne(selector, {
            $set: {
              productId: resolvedProduct._id,
              updated: new Date(),
              updatedBy: requestContext.userId,
            },
          });
        }

        await OrderPositions.updateOne(selector, {
          $set: {
            configuration,
            updated: new Date(),
            updatedBy: requestContext.userId,
          },
        });
      }

      await updateCalculation(orderId, requestContext);

      const updatedOrderPosition = await OrderPositions.findOne(selector);

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

      return true;
    },

    updateCalculation: async (orderPosition, requestContext) => {
      log(`OrderPosition ${orderPosition._id} -> Update Calculation`, {
        orderId: orderPosition.orderId,
      });

      const calculation = await requestContext.modules.products.calculate(
        { item: orderPosition },
        requestContext,
      );
      const selector = buildFindByIdSelector(orderPosition._id);

      await OrderPositions.updateOne(selector, {
        $set: { calculation },
      });

      return OrderPositions.findOne(selector);
    },

    addProductItem: async (orderPosition, { order, product }, requestContext) => {
      const { modules } = requestContext;
      const { configuration, context, orderId: positionOrderId, quantity, ...scope } = orderPosition;
      const orderId = order._id || positionOrderId;

      // Resolve product
      const resolvedProduct = await modules.products.resolveOrderableProduct(
        product,
        { configuration },
        requestContext,
      );

      // Search for existing position
      const selector: Query = {
        orderId,
        productId: resolvedProduct._id,
        originalProductId: product._id,
        configuration: configuration || { $exists: false },
        ...scope,
      };
      const existingPosition = await OrderPositions.findOne(selector);

      // Update position if exists
      let upsertedOrderPosition: OrderPosition;

      if (existingPosition) {
        upsertedOrderPosition = await modules.orders.positions.update(
          {
            orderId,
            orderPositionId: existingPosition._id,
          },
          {
            quantity: existingPosition.quantity + quantity,
          },
          requestContext,
        );
      } else {
        // Otherwise add new position
        upsertedOrderPosition = await modules.orders.positions.create(
          orderPosition,
          { order, product: resolvedProduct, originalProduct: product },
          requestContext,
        );
      }

      emit('ORDER_ADD_PRODUCT', { orderPosition: upsertedOrderPosition });

      return upsertedOrderPosition;
    },
  };
};
