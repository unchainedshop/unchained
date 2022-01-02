import {
  Collection,
  Filter,
  ModuleMutations,
} from '@unchainedshop/types/common';
import {
  OrderDeliveriesModule,
  OrderDelivery,
} from '@unchainedshop/types/orders.deliveries';
import { DeliveryPricingDirector } from 'meteor/unchained:core-delivery';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
  objectInvert,
} from 'meteor/unchained:utils';
import { OrderDeliveriesSchema } from '../db/OrderDeliveriesSchema';
import { OrderDeliveryStatus } from '../db/OrderDeliveryStatus';
import { OrderPricingSheet } from '../director/OrderPricingSheet';

const ORDER_DELIVERY_EVENTS: string[] = ['ORDER_DELIVER'];

const buildFindByIdSelector = (orderDeliveryId: string) =>
  generateDbFilterById(orderDeliveryId) as Filter<OrderDelivery>;

export const configureOrderDeliveriesModule = async ({
  OrderDeliveries,
}: {
  OrderDeliveries: Collection<OrderDelivery>;
}): Promise<OrderDeliveriesModule> => {
  registerEvents(ORDER_DELIVERY_EVENTS);

  const mutations = generateDbMutations<OrderDelivery>(
    OrderDeliveries,
    OrderDeliveriesSchema
  ) as ModuleMutations<OrderDelivery>;

  const updateCalculation: OrderDeliveriesModule['updateCalculation'] = async (
    orderDelivery,
    requestContext
  ) => {
    log(`OrderDelivery ${orderDelivery._id} -> Update Calculation`, {
      orderId: orderDelivery.orderId,
    });

    const pricing = DeliveryPricingDirector.actions(
      {
        item: orderDelivery,
      },
      requestContext
    );
    const calculation = await pricing.calculate();

    await OrderDeliveries.updateOne(
      buildFindByIdSelector(orderDelivery._id as string),
      {
        $set: {
          calculation,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      }
    );

    return true;
  };

  const updateStatus: OrderDeliveriesModule['updateStatus'] = async (
    orderDeliveryId,
    { status, info },
    userId
  ) => {
    log(`OrderDelivery ${orderDeliveryId} -> New Status: ${status}`);

    const date = new Date();
    const modifier = {
      $set: { status, updated: new Date(), updatedBy: userId },
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };
    if (status === OrderDeliveryStatus.DELIVERED) {
      /* @ts-ignore */
      modifier.$set.delivered = date;
    }

    const selector = buildFindByIdSelector(orderDeliveryId);
    await OrderDeliveries.updateOne(selector, modifier);
    return await OrderDeliveries.findOne(selector);
  };

  return {
    // Queries
    findDelivery: async ({ orderDeliveryId }) => {
      return await OrderDeliveries.findOne(
        buildFindByIdSelector(orderDeliveryId)
      );
    },

    // Transformations
    normalizedStatus: (orderDelivery) => {
      return objectInvert(OrderDeliveryStatus)[orderDelivery.status || null];
    },
    isBlockingOrderFullfillment: (orderDelivery) => {
      if (orderDelivery.status === OrderDeliveryStatus.DELIVERED) return false;
      return true;
    },
    pricingSheet: (orderDelivery, currency) => {
      return OrderPricingSheet({
        calculation: orderDelivery.calculation,
        currency,
      });
    },

    // Mutations

    create: async (doc, userId) => {
      const orderDeliveryId = await mutations.create(
        { ...doc, context: doc.context || {}, status: null },
        userId
      );

      const orderDelivery = await OrderDeliveries.findOne(
        buildFindByIdSelector(orderDeliveryId)
      );
      return orderDelivery;
    },

    markAsDelivered: async (orderDelivery, userId) => {
      if (orderDelivery.status !== OrderDeliveryStatus.OPEN) return;
      const updatedOrderDelivery = await updateStatus(
        orderDelivery._id as string,
        {
          status: OrderDeliveryStatus.DELIVERED,
          info: 'mark delivered manually',
        },
        userId
      );
      emit('ORDER_DELIVER', { orderDelivery: updatedOrderDelivery });
    },

    delete: async (orderDeliveryId, userId) => {
      const deletedCount = await mutations.delete(orderDeliveryId, userId);
      return deletedCount;
    },

    updateDelivery: async (
      orderDeliveryId,
      { orderId, context },
      requestContext
    ) => {
      log(`OrderDelivery ${orderDeliveryId} -> Update Context`, {
        orderId,
      });

      const selector = buildFindByIdSelector(orderDeliveryId);
      await OrderDeliveries.updateOne(selector, {
        $set: {
          context: context || {},
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const orderDelivery = await OrderDeliveries.findOne(selector);
      await updateCalculation(orderDelivery, requestContext);
      emit('ORDER_UPDATE_DELIVERY', { orderDelivery });
      return orderDelivery;
    },

    updateStatus,

    updateCalculation,
  };
};
