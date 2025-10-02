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
}) => {
  registerEvents(ORDER_EVENTS);

  return {
    create: async ({
      userId,
      orderNumber,
      currencyCode,
      countryCode,
      billingAddress,
      contact,
      context,
    }: {
      userId: string;
      billingAddress?: Address;
      contact?: Contact;
      countryCode: string;
      currencyCode: string;
      orderNumber?: string;
      originEnrollmentId?: string;
      context?: Record<string, any>;
    }) => {
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
        context: context || {},
      });

      const order = (await Orders.findOne(generateDbFilterById(orderId), {})) as Order;

      await emit('ORDER_CREATE', { order });
      return order;
    },

    delete: async (orderId: string) => {
      const { deletedCount } = await Orders.deleteOne({ _id: orderId });
      if (!deletedCount) return 0;
      await emit('ORDER_REMOVE', { orderId });
      return deletedCount;
    },

    setCartOwner: async ({ orderId, userId }: { orderId: string; userId: string }) => {
      await Orders.updateOne(generateDbFilterById(orderId), {
        $set: {
          userId,
        },
      });
    },

    moveCartPositions: async ({
      fromOrderId,
      toOrderId,
    }: {
      fromOrderId: string;
      toOrderId: string;
    }) => {
      await OrderPositions.updateMany(
        { orderId: fromOrderId },
        {
          $set: {
            orderId: toOrderId,
          },
        },
      );
    },

    updateBillingAddress: async (orderId: string, billingAddress: Address) => {
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
      if (!order) return null;
      await emit('ORDER_UPDATE', { order, field: 'billingAddress' });
      return order;
    },

    updateContact: async (orderId: string, contact: Contact) => {
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
      if (!order) return null;
      await emit('ORDER_UPDATE', { order, field: 'contact' });
      return order;
    },

    updateCalculationSheet: async (orderId: string, calculation: any) => {
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
      if (!order) return null;
      await emit('ORDER_UPDATE', { order, field: 'calculation' });
      return order;
    },

    updateContext: async (orderId: string, context: any) => {
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
      if (!order) return null;
      await emit('ORDER_UPDATE', { order, field: 'context' });
      return order;
    },
  };
};

export type OrderMutations = ReturnType<typeof configureOrderModuleMutations>;
