import { emit, registerEvents } from '@unchainedshop/events';
import {
  Address,
  Contact,
  generateDbFilterById,
  generateDbObjectId,
  mongodb,
} from '@unchainedshop/mongodb';
import { Order, OrderStatus } from '../db/OrdersCollection.js';
import { OrderPosition } from '../db/OrderPositionsCollection.js';

export interface OrderMutations {
  create: (doc: {
    userId: string;
    billingAddress?: Address;
    contact?: Contact;
    countryCode: string;
    currencyCode: string;
    orderNumber?: string;
    originEnrollmentId?: string;
  }) => Promise<Order>;

  delete: (orderId: string) => Promise<number>;

  setCartOwner: (params: { orderId: string; userId: string }) => Promise<void>;
  moveCartPositions: (params: { fromOrderId: string; toOrderId: string }) => Promise<void>;

  updateBillingAddress: (orderId: string, billingAddress: Address) => Promise<Order>;
  updateContact: (orderId: string, contact: Contact) => Promise<Order>;
  updateContext: (orderId: string, context: any) => Promise<Order>;
  updateCalculationSheet: (orderId: string, calculation) => Promise<Order>;
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
  OrderPositions,
}: {
  Orders: mongodb.Collection<Order>;
  OrderPositions: mongodb.Collection<OrderPosition>;
}): OrderMutations => {
  registerEvents(ORDER_EVENTS);

  return {
    create: async ({ userId, orderNumber, currencyCode, countryCode, billingAddress, contact }) => {
      const { insertedId: orderId } = await Orders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        status: null,
        billingAddress,
        contact,
        userId,
        currencyCode,
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

      await emit('ORDER_UPDATE', { order, field: 'billingAddress' });
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
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            ...contextSetters,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      if (order) {
        await emit('ORDER_UPDATE', { order, field: 'context' });
        return order;
      }
      return null;
    },
  };
};
