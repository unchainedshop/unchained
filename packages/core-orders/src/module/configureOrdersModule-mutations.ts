import { Collection, ModuleMutations } from '@unchainedshop/types/common';
import { LogLevel } from 'meteor/unchained:logger';
import {
  Order,
  OrderMutations,
  OrdersModule,
} from '@unchainedshop/types/orders';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { OrderPosition } from '@unchainedshop/types/orders.positions';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
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
  OrderPositions,
  OrderDeliveries,
  OrderPayments,
  OrderDiscounts,
  initProviders,
  updateStatus,
  updateCalculation,
}: {
  Orders: Collection<Order>;
  OrderPositions: Collection<OrderPosition>;
  OrderDeliveries: Collection<OrderDelivery>;
  OrderPayments: Collection<OrderPayment>;
  OrderDiscounts: Collection<OrderDiscount>;
  initProviders: OrdersModule['initProviders'];
  updateStatus: OrdersModule['updateStatus'];
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderMutations => {
  registerEvents(ORDER_EVENTS);

  const mutations = generateDbMutations<Order>(
    Orders,
    OrdersSchema
  ) as ModuleMutations<Order>;

  return {
    create: async (
      { orderNumber, currency, countryCode, billingAddress, contact },
      userId
    ) => {
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
        userId
      );

      const order = await Orders.findOne(generateDbFilterById(orderId), {});
      emit('ORDER_CREATE', { order });
      return order;
    },

    delete: async (orderId, userId) => {
      const deletedCount = await mutations.delete(orderId, userId);
      emit('ORDER_REMOVE', { orderId });
      return deletedCount;
    },

    initProviders,

    invalidateProviders: async (requestContext) => {
      log('Orders: Start invalidating cart providers', {
        level: LogLevel.Verbose,
      });

      const orders = await Orders.find({
        status: { $eq: null }, // Null equals OrderStatus.OPEN
      }).toArray();

      await Promise.all(
        orders.map(async (order) => await initProviders(order, requestContext))
      );
    },

    setDeliveryProvider: async (
      orderId,
      deliveryProviderId,
      requestContext
    ) => {
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
            requestContext.userId
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

      emit('ORDER_SET_DELIVERY_PROVIDER', {
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
            userId
          )
        )._id;
      log(`Set Payment Provider ${paymentProviderId}`, { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: { paymentId, updated: new Date(), updatedBy: userId },
      });

      const order = await updateCalculation(orderId, requestContext);

      emit('ORDER_SET_PAYMENT_PROVIDER', {
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
      emit('ORDER_UPDATE', { order, field: 'billing' });
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
      emit('ORDER_UPDATE', { order, field: 'contact' });
      return order;
    },

    updateContext: async (orderId, context, requestContext) => {
      log('Update Arbitrary Context', { orderId, context });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          context,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE', { order, field: 'context' });
      return order;
    },

    updateStatus,
    updateCalculation,
  };
};
