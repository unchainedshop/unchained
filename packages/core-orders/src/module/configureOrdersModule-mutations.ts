import { Order, OrderStatus, OrderDelivery, OrderPayment, OrderPosition } from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  Address,
  Contact,
  generateDbFilterById,
  generateDbObjectId,
  mongodb,
} from '@unchainedshop/mongodb';

export interface OrderMutations {
  create: (doc: {
    userId: string;
    billingAddress?: Address;
    contact?: Contact;
    countryCode: string;
    currency: string;
    orderNumber?: string;
    originEnrollmentId?: string;
  }) => Promise<Order>;

  delete: (orderId: string) => Promise<number>;

  setCartOwner: (params: { orderId: string; userId: string }) => Promise<void>;
  moveCartPositions: (params: { fromOrderId: string; toOrderId: string }) => Promise<void>;

  setDeliveryProvider: (orderId: string, deliveryProviderId: string, unchainedAPI) => Promise<Order>;
  setPaymentProvider: (orderId: string, paymentProviderId: string, unchainedAPI) => Promise<Order>;

  updateBillingAddress: (orderId: string, billingAddress: Address) => Promise<Order>;
  updateContact: (orderId: string, contact: Contact) => Promise<Order>;
  updateContext: (orderId: string, context: any) => Promise<Order>;
  updateCalculationSheet: (orderId: string, calculation) => Promise<Order>;
  deleteUserOrders: (userId: string) => Promise<number>;
}

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
}: {
  Orders: mongodb.Collection<Order>;
  OrderDeliveries: mongodb.Collection<OrderDelivery>;
  OrderPayments: mongodb.Collection<OrderPayment>;
  OrderPositions: mongodb.Collection<OrderPosition>;
}): OrderMutations => {
  registerEvents(ORDER_EVENTS);

  return {
    create: async ({ userId, orderNumber, currency, countryCode, billingAddress, contact }) => {
      const { insertedId: orderId } = await Orders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        status: null,
        billingAddress,
        contact,
        userId,
        currency,
        countryCode,
        calculation: [],
        log: [],
        orderNumber,
      });

      const order = await Orders.findOne(generateDbFilterById(orderId), {});

      await emit('ORDER_CREATE', { order });
      return order;
    },

    delete: async (orderId) => {
      const { deletedCount } = await Orders.deleteOne({ _id: orderId });
      await emit('ORDER_REMOVE', { orderId });
      return deletedCount;
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

    setDeliveryProvider: async (orderId, deliveryProviderId, { modules }) => {
      const delivery = await OrderDeliveries.findOne({
        orderId,
        deliveryProviderId,
      });
      const deliveryId =
        delivery?._id ||
        (
          await modules.orders.deliveries.create({
            calculation: [],
            deliveryProviderId,
            log: [],
            orderId,
            status: null,
          })
        )._id;

      const selector = generateDbFilterById(orderId);
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            deliveryId,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      await emit('ORDER_SET_DELIVERY_PROVIDER', {
        order,
        deliveryProviderId,
      });

      return order;
    },

    setPaymentProvider: async (orderId, paymentProviderId, unchainedAPI) => {
      const { modules } = unchainedAPI;
      const payment = await OrderPayments.findOne({
        orderId,
        paymentProviderId,
      });

      const paymentId =
        payment?._id ||
        (
          await modules.orders.payments.create({
            calculation: [],
            paymentProviderId,
            log: [],
            orderId,
            status: null,
          })
        )._id;
      const selector = generateDbFilterById(orderId);
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: { paymentId, updated: new Date() },
        },
        { returnDocument: 'after' },
      );

      await emit('ORDER_SET_PAYMENT_PROVIDER', {
        order,
        paymentProviderId,
      });

      return order;
    },

    updateBillingAddress: async (orderId, billingAddress) => {
      const selector = generateDbFilterById(orderId);
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            billingAddress,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      await emit('ORDER_UPDATE', { order, field: 'billing' });
      return order;
    },

    updateContact: async (orderId, contact) => {
      const selector = generateDbFilterById(orderId);
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            contact,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      await emit('ORDER_UPDATE', { order, field: 'contact' });
      return order;
    },

    updateCalculationSheet: async (orderId, calculation) => {
      const selector = generateDbFilterById(orderId);
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            calculation,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      await emit('ORDER_UPDATE', { order, field: 'calculation' });
      return order;
    },

    updateContext: async (orderId, context) => {
      const selector = generateDbFilterById<Order>(orderId);
      selector.status = { $in: [null, OrderStatus.PENDING] };

      if (!context || Object.keys(context).length === 0) return Orders.findOne(selector, {});

      const contextSetters = Object.fromEntries(
        Object.entries(context).map(([key, value]) => [`context.${key}`, value]),
      );
      const result = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            ...contextSetters,
            updated: new Date(),
          },
        },
        { includeResultMetadata: true, returnDocument: 'after' },
      );

      if (result.ok) {
        await emit('ORDER_UPDATE', { order: result.value, field: 'context' });
        return result.value;
      }
      return null;
    },
    deleteUserOrders: async (userId) => {
      const deletedUserOrdersResult = await Orders.deleteMany({ userId });
      return deletedUserOrdersResult.deletedCount;
    },
  };
};
