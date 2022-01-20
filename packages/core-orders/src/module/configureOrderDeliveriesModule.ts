import {
  Collection,
  Filter,
  ModuleMutations,
} from '@unchainedshop/types/common';
import { OrdersModule } from '@unchainedshop/types/orders';
import {
  OrderDeliveriesModule,
  OrderDelivery,
} from '@unchainedshop/types/orders.deliveries';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { OrderDeliveriesSchema } from '../db/OrderDeliveriesSchema';
import { OrderDeliveryStatus } from '../db/OrderDeliveryStatus';
import { OrderPricingSheet } from '../director/OrderPricingSheet';

const ORDER_DELIVERY_EVENTS: string[] = [
  'ORDER_DELIVER',
  'ORDER_UPDATE_DELIVERY',
];

const buildFindByIdSelector = (orderDeliveryId: string) =>
  generateDbFilterById(orderDeliveryId) as Filter<OrderDelivery>;

export const configureOrderDeliveriesModule = ({
  OrderDeliveries,
  updateCalculation,
}: {
  OrderDeliveries: Collection<OrderDelivery>;
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderDeliveriesModule => {
  registerEvents(ORDER_DELIVERY_EVENTS);

  const mutations = generateDbMutations<OrderDelivery>(
    OrderDeliveries,
    OrderDeliveriesSchema
  ) as ModuleMutations<OrderDelivery>;

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
    findDelivery: async ({ orderDeliveryId }, options) => {
      return await OrderDeliveries.findOne(
        buildFindByIdSelector(orderDeliveryId),
        options
      );
    },

    // Transformations
    discounts: (orderDelivery, { order, orderDiscount }, { modules }) => {
      if (!orderDelivery) return [];

      const pricingSheet = modules.orders.deliveries.pricingSheet(
        orderDelivery,
        order.currency
      );

      return pricingSheet.discountPrices(orderDiscount._id).map((discount) => ({
        delivery: orderDelivery,
        ...discount,
      }));
    },

    isBlockingOrderConfirmation: async (orderDelivery, requestContext) => {
      const provider = await requestContext.modules.delivery.findProvider({
        deliveryProviderId: orderDelivery.deliveryProviderId,
      });

      return requestContext.modules.delivery.isAutoReleaseAllowed(
        provider,
        requestContext
      );
    },
    isBlockingOrderFullfillment: (orderDelivery) => {
      if (orderDelivery.status === OrderDeliveryStatus.DELIVERED) return false;
      return true;
    },
    
    normalizedStatus: (orderDelivery) => {
      return orderDelivery.status === null
        ? OrderDeliveryStatus.OPEN
        : (orderDelivery.status as OrderDeliveryStatus);
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

    delete: async (orderDeliveryId, userId) => {
      const deletedCount = await mutations.delete(orderDeliveryId, userId);
      return deletedCount;
    },

    markAsDelivered: async (orderDelivery, userId) => {
      if (orderDelivery.status !== null /* OrderDeliveryStatus.OPEN */) return;
      const updatedOrderDelivery = await updateStatus(
        orderDelivery._id,
        {
          status: OrderDeliveryStatus.DELIVERED,
          info: 'mark delivered manually',
        },
        userId
      );
      emit('ORDER_DELIVER', { orderDelivery: updatedOrderDelivery });
    },

    send: async (orderDelivery, { order, deliveryContext }, requestContext) => {
      if (orderDelivery.status !== OrderDeliveryStatus.OPEN)
        return orderDelivery;

      const deliveryProvider =
        await requestContext.modules.delivery.findProvider({
          deliveryProviderId: orderDelivery.deliveryProviderId,
        });

      const deliveryProviderId = deliveryProvider._id;

      const address =
        orderDelivery.context?.address || order || order.billingAddress || {};

      const arbitraryResponseData = await requestContext.modules.delivery.send(
        deliveryProviderId,
        {
          order,
          orderDelivery,
          transactionContext: {
            ...(deliveryContext || {}),
            ...(orderDelivery.context || {}),
            address,
          },
        },
        requestContext
      );

      if (arbitraryResponseData) {
        return await updateStatus(
          orderDelivery._id,
          {
            status: OrderDeliveryStatus.DELIVERED,
            info: JSON.stringify(arbitraryResponseData),
          },
          requestContext.userId
        );
      }

      return orderDelivery;
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
      await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE_DELIVERY', { orderDelivery });
      return orderDelivery;
    },

    updateStatus,

    updateCalculation: async (orderDelivery, requestContext) => {
      log(`OrderDelivery ${orderDelivery._id} -> Update Calculation`, {
        orderId: orderDelivery.orderId,
      });

      const calculation = await requestContext.modules.delivery.calculate(
        {
          item: orderDelivery,
        },
        requestContext
      );

      await OrderDeliveries.updateOne(
        buildFindByIdSelector(orderDelivery._id),
        {
          $set: {
            calculation,
            updated: new Date(),
            updatedBy: requestContext.userId,
          },
        }
      );

      return true;
    },
  };
};
