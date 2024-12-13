import { OrderPosition } from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { PricingCalculation } from '@unchainedshop/utils';

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
}) => {
  registerEvents(ORDER_POSITION_EVENTS);

  return {
    // Queries
    findOrderPosition: async (
      { itemId }: { itemId: string },
      options?: mongodb.FindOptions,
    ): Promise<OrderPosition> => {
      return OrderPositions.findOne(buildFindByIdSelector(itemId), options);
    },

    findOrderPositions: async ({ orderId }: { orderId: string }): Promise<OrderPosition[]> => {
      const positions = OrderPositions.find({ orderId, quantity: { $gt: 0 } });
      return positions.toArray();
    },

    delete: async (orderPositionId: string): Promise<OrderPosition> => {
      const selector = buildFindByIdSelector(orderPositionId);
      const orderPosition = await OrderPositions.findOneAndDelete(selector, {});
      await emit('ORDER_REMOVE_CART_ITEM', {
        orderPosition,
      });
      return { ...orderPosition, calculation: [] };
    },

    removePositions: async ({ orderId }: { orderId: string }): Promise<number> => {
      const result = await OrderPositions.deleteMany({ orderId });
      await emit('ORDER_EMPTY_CART', { orderId, count: result.deletedCount });
      return result.deletedCount;
    },

    updateProductItem: async ({
      orderPositionId,
      quantity,
      configuration,
    }: {
      orderPositionId: string;
      configuration?: Array<{ key: string; value: string }>;
      quantity?: number;
    }): Promise<OrderPosition> => {
      const modifier: any = {
        $set: {
          updated: new Date(),
        },
      };

      if (quantity !== null) {
        modifier.$set.quantity = quantity;
      }

      if (configuration !== null) {
        modifier.$set.configuration = configuration;
      }

      const updatedOrderPosition = await OrderPositions.findOneAndUpdate(
        {
          _id: orderPositionId,
        },
        modifier,
        {
          returnDocument: 'after',
        },
      );

      await emit('ORDER_UPDATE_CART_ITEM', {
        orderPosition: updatedOrderPosition,
      });

      return updatedOrderPosition;
    },

    removeProductByIdFromAllOpenPositions: async (productId: string): Promise<Array<string>> => {
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

    updateScheduling: async (orderPositionId, scheduling): Promise<OrderPosition> => {
      return OrderPositions.findOneAndUpdate(
        generateDbFilterById(orderPositionId),
        {
          $set: { scheduling },
        },
        {
          returnDocument: 'after',
        },
      );
    },

    updateCalculation: async <T extends PricingCalculation>(
      orderPositionId: string,
      calculation: Array<T>,
    ): Promise<OrderPosition> => {
      return OrderPositions.findOneAndUpdate(
        { _id: orderPositionId },
        {
          $set: { calculation },
        },
        {
          returnDocument: 'after',
        },
      );
    },

    addProductItem: async (orderPosition: {
      context?: any;
      configuration?: Array<{ key: string; value: string }>;
      orderId: string;
      originalProductId: string;
      productId: string;
      quantity: number;
      quotationId?: string;
    }): Promise<OrderPosition> => {
      const { configuration, orderId, originalProductId, productId, quantity, ...scope } = orderPosition;

      // Search for existing position
      const selector: mongodb.Filter<OrderPosition> = {
        orderId,
        productId,
        originalProductId,
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
            productId,
            originalProductId,
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
    deleteOrderPositions: async (orderId: string) => {
      const { deletedCount } = await OrderPositions.deleteMany({ orderId });
      return deletedCount;
    },
  };
};

export type OrderPositionsModule = ReturnType<typeof configureOrderPositionsModule>;
