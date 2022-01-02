import { Context } from '@unchainedshop/types/api';
import {
  Collection,
  Filter,
  ModuleMutations,
} from '@unchainedshop/types/common';
import { OrdersModule } from '@unchainedshop/types/orders';
import {
  OrderPositionsModule,
  OrderPosition,
} from '@unchainedshop/types/orders.positions';
import { Product } from '@unchainedshop/types/products';
import { ProductPricingDirector } from 'meteor/unchained:core-products';
import { PaymentDirector } from 'meteor/unchained:core-payment';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
  objectInvert,
} from 'meteor/unchained:utils';
import { OrderPositionsSchema } from '../db/OrderPositionsSchema';
import { OrderPricingSheet } from '../director/OrderPricingSheet';

const ORDER_POSITION_EVENTS: string[] = [
  'ORDER_UPDATE_CART_ITEM',
  'ORDER_REMOVE_CART_ITEM',
  'ORDER_EMPTY_CART',
];

const buildFindByIdSelector = (orderPositionId: string, orderId?: string) =>
  generateDbFilterById(
    orderPositionId,
    orderId ? { orderId } : undefined
  ) as Filter<OrderPosition>;

export const configureOrderPositionsModule = async ({
  OrderPositions,
  updateCalculation,
}: {
  OrderPositions: Collection<OrderPosition>;
  updateCalculation: OrdersModule['updateCalculation'];
}): Promise<OrderPositionsModule> => {
  registerEvents(ORDER_POSITION_EVENTS);

  const mutations = generateDbMutations<OrderPosition>(
    OrderPositions,
    OrderPositionsSchema
  ) as ModuleMutations<OrderPosition>;

  return {
    // Queries
    findOrderPosition: async ({ itemId }) => {
      return await OrderPositions.findOne(buildFindByIdSelector(itemId));
    },
    findOrderPositions: async ({}, options) => {
      const positions = OrderPositions.find(options);
      return await positions.toArray();
    },

    // Transformations
    discounts: (orderPosition, { currency, discountId }) => {
      const pricingSheet = OrderPricingSheet({
        calculation: orderPosition.calculation,
        currency,
        quantity: orderPosition.quantity,
      });
      const discounts = pricingSheet
        .discountPrices(discountId)
        .map((discount) => ({
          item: orderPosition,
          ...discount,
        }));
      return discounts;
    },

    pricingSheet: (orderPosition, { currency }) => {
      return OrderPricingSheet({
        calculation: orderPosition.calculation,
        currency,
        quantity: orderPosition.quantity,
      });
    },

    // Mutations

    create: async (
      { configuration, orderId, product, quantity, quotationId },
      requestContext
    ) => {
      log(
        `Create ${quantity}x Position with Product ${product._id} ${
          quotationId ? ` (${quotationId})` : ''
        }`,
        { orderId }
      );

      const positionId = await mutations.create(
        {
          orderId,
          productId: product._id as string,
          quotationId,
          quantity,
          configuration,
          calculation: [],
          scheduling: [],
        },
        requestContext.userId
      );

      await updateCalculation(orderId, requestContext);

      return await OrderPositions.findOne(buildFindByIdSelector(positionId));
    },

    delete: async (orderPositionId, requestContext) => {
      const selector = buildFindByIdSelector(orderPositionId);
      const orderPosition = await OrderPositions.findOne(
        buildFindByIdSelector(orderPositionId)
      );

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

    update: async (
      { orderId, orderPositionId },
      { quantity, configuration },
      requestContext
    ) => {
      const selector = buildFindByIdSelector(orderPositionId, orderId);
      const orderPosition = await OrderPositions.findOne(selector);

      if (quantity !== null) {
        log(
          `OrderPosition ${orderPositionId} -> Update Quantity of ${orderPositionId} to ${quantity}x`,
          { orderId }
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
            configuration
          )}x`,
          { orderId }
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
          const resolvedProduct =
            await requestContext.modules.products.resolveOrderableProduct(
              originalProduct,
              {
                configuration,
              }
            );

          await OrderPositions.updateOne(selector, {
            $set: {
              productId: resolvedProduct._id as string,
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

    updateCalculation: async (orderPosition, requestContext) => {
      log(`OrderPosition ${orderPosition._id} -> Update Calculation`, {
        orderId: orderPosition.orderId,
      });

      const pricing = ProductPricingDirector.actions(
        { item: orderPosition },
        requestContext
      );
      const calculation = await pricing.calculate();
      const selector = buildFindByIdSelector(orderPosition._id as string);

      await OrderPositions.updateOne(selector, {
        $set: { calculation },
      });

      return await OrderPositions.findOne(selector);
    },
  };
};
