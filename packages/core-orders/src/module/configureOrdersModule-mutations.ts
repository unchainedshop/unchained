import { Collection } from '@unchainedshop/types/common';
import { ModuleMutations } from '@unchainedshop/types/core';
import { Order, OrderStatus, OrderMutations, OrdersModule } from '@unchainedshop/types/orders';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { emit, registerEvents } from '@unchainedshop/events';
import { log, LogLevel } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { Context } from '@unchainedshop/types/api';
import { OrderPosition } from '@unchainedshop/types/orders.positions';
import { OrdersSchema } from '../db/OrdersSchema';

const ORDER_EVENTS: string[] = [
  'ORDER_CREATE',
  'ORDER_REMOVE',
  'ORDER_SET_DELIVERY_PROVIDER',
  'ORDER_SET_PAYMENT_PROVIDER',
  'ORDER_UPDATE',
];

export const configureOrderModuleMutations = ({
  Orders,
  OrderDeliveries,
  OrderPayments,
  OrderPositions,
  initProviders,
  updateCalculation,
}: {
  Orders: Collection<Order>;
  OrderDeliveries: Collection<OrderDelivery>;
  OrderPayments: Collection<OrderPayment>;
  OrderPositions: Collection<OrderPosition>;
  initProviders: OrdersModule['initProviders'];
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderMutations => {
  registerEvents(ORDER_EVENTS);

  const mutations = generateDbMutations<Order>(Orders, OrdersSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<Order>;

  return {
    create: async ({ orderNumber, currency, countryCode, billingAddress, contact }, userId) => {
      const orderId = await mutations.create(
        {
          created: new Date(),
          createdBy: userId,
          status: null,
          billingAddress,
          contact,
          userId,
          currency,
          countryCode,
          calculation: [],
          log: [],
          orderNumber,
        },
        userId,
      );

      const order = await Orders.findOne(generateDbFilterById(orderId), {});

      await emit('ORDER_CREATE', { order });
      return order;
    },

    delete: async (orderId, userId) => {
      const deletedCount = await mutations.delete(orderId, userId);
      await emit('ORDER_REMOVE', { orderId });
      return deletedCount;
    },

    initProviders,

    invalidateProviders: async (requestContext, maxAgeDays = 30) => {
      log('Orders: Start invalidating cart providers', {
        level: LogLevel.Verbose,
      });

      const ONE_DAY_IN_MILLISECONDS = 86400000;

      const minValidDate = new Date(new Date().getTime() - maxAgeDays * ONE_DAY_IN_MILLISECONDS);

      const orders = await Orders.find({
        status: { $eq: null },
        updated: { $gte: minValidDate },
      }).toArray();

      await Promise.all(orders.map((order) => initProviders(order, requestContext as Context))); // TODO: Refactor Types
    },

    setCartOwner: async ({ orderId, userId }) => {
      await Orders.updateOne(generateDbFilterById(orderId), {
        $set: {
          userId,
        },
      });
    },

    moveCartPositions: async ({ fromOrderId, toOrderId }) => {
      await OrderPositions.updateMany(
        { orderId: fromOrderId },
        {
          $set: {
            orderId: toOrderId,
          },
        },
      );
    },

    setDeliveryProvider: async (orderId, deliveryProviderId, requestContext) => {
      const { modules } = requestContext;
      const delivery = await OrderDeliveries.findOne({
        orderId,
        deliveryProviderId,
      });
      const deliveryId =
        delivery?._id ||
        (
          await modules.orders.deliveries.create(
            {
              calculation: [],
              deliveryProviderId,
              log: [],
              orderId,
              status: null,
            },
            requestContext.userId,
          )
        )._id;

      log(`Set Delivery Provider ${deliveryProviderId}`, { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          deliveryId,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);

      await emit('ORDER_SET_DELIVERY_PROVIDER', {
        order,
        deliveryProviderId,
      });

      return order;
    },

    setPaymentProvider: async (orderId, paymentProviderId, requestContext) => {
      const { modules, userId } = requestContext;
      const payment = await OrderPayments.findOne({
        orderId,
        paymentProviderId,
      });

      const paymentId =
        payment?._id ||
        (
          await modules.orders.payments.create(
            {
              calculation: [],
              paymentProviderId,
              log: [],
              orderId,
              status: null,
            },
            userId,
          )
        )._id;
      log(`Set Payment Provider ${paymentProviderId}`, { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: { paymentId, updated: new Date(), updatedBy: userId },
      });

      const order = await updateCalculation(orderId, requestContext);

      await emit('ORDER_SET_PAYMENT_PROVIDER', {
        order,
        paymentProviderId,
      });

      return order;
    },

    updateBillingAddress: async (orderId, billingAddress, requestContext) => {
      log('Update Invoicing Address', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          billingAddress,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);
      await emit('ORDER_UPDATE', { order, field: 'billing' });
      return order;
    },

    updateContact: async (orderId, contact, requestContext) => {
      log('Update Contact', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          contact,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);
      await emit('ORDER_UPDATE', { order, field: 'contact' });
      return order;
    },

    updateContext: async (orderId, context, requestContext) => {
      if (!context) return false;

      log('Update Arbitrary Context', { orderId, context });
      const selector = generateDbFilterById<Order>(orderId);
      selector.status = { $in: [null, OrderStatus.PENDING] };
      const order = await Orders.findOne(selector);

      const result = await Orders.updateOne(selector, {
        $set: {
          context: { ...(order.context || {}), ...context },
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      if (result.modifiedCount) {
        const updatedOrder = await updateCalculation(orderId, requestContext);
        await emit('ORDER_UPDATE', { order: updatedOrder, field: 'context' });
        return true;
      }
      return false;
    },

    updateCalculation,
  };
};
