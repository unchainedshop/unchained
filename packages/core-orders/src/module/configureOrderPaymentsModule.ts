import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { PricingCalculation } from '@unchainedshop/utils';
import { OrderPayment, OrderPaymentStatus } from '../db/OrderPaymentsCollection.js';

const ORDER_PAYMENT_EVENTS: string[] = ['ORDER_UPDATE_PAYMENT', 'ORDER_SIGN_PAYMENT', 'ORDER_PAY'];

export const buildFindOrderPaymentByIdSelector = (orderPaymentId: string) =>
  generateDbFilterById(orderPaymentId) as mongodb.Filter<OrderPayment>;

export const buildFindByContextDataSelector = (context: any): mongodb.Filter<OrderPayment> => {
  const contextKeys = Object.keys(context);

  if (contextKeys.length === 0) return null;

  const selector: mongodb.Filter<OrderPayment> = contextKeys.reduce(
    (currentSelector, key) =>
      context[key] !== undefined
        ? {
            ...currentSelector,
            [`context.${key}`]: context[key],
          }
        : currentSelector,
    {},
  );
  return selector;
};

export const configureOrderPaymentsModule = ({
  OrderPayments,
}: {
  OrderPayments: mongodb.Collection<OrderPayment>;
}) => {
  registerEvents(ORDER_PAYMENT_EVENTS);

  const normalizedStatus = (orderPayment: OrderPayment) => {
    return orderPayment.status === null
      ? OrderPaymentStatus.OPEN
      : (orderPayment.status as OrderPaymentStatus);
  };

  const updateStatus = async (
    orderPaymentId: string,
    {
      transactionId,
      status,
      info,
    }: { transactionId?: string; status: OrderPaymentStatus; info?: string },
  ): Promise<OrderPayment> => {
    const date = new Date();
    const modifier: mongodb.UpdateFilter<OrderPayment> = {
      $set: { status, updated: new Date() },
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };
    if (transactionId) {
      // eslint-disable-next-line
      // @ts-ignore
      modifier.$set.transactionId = transactionId;
    }
    if (status === OrderPaymentStatus.PAID) {
      // eslint-disable-next-line
      // @ts-ignore
      modifier.$set.paid = date;
    }

    const selector = buildFindOrderPaymentByIdSelector(orderPaymentId);
    return OrderPayments.findOneAndUpdate(selector, modifier, { returnDocument: 'after' });
  };

  return {
    // Queries
    findOrderPayment: async (
      {
        orderPaymentId,
      }: {
        orderPaymentId: string;
      },
      options?: mongodb.FindOptions,
    ): Promise<OrderPayment> => {
      return OrderPayments.findOne(buildFindOrderPaymentByIdSelector(orderPaymentId), options);
    },
    findOrderPaymentByContextData: async (
      {
        context,
      }: {
        context: any;
      },
      options?: mongodb.FindOptions,
    ): Promise<OrderPayment> => {
      const selector = buildFindByContextDataSelector(context);

      return OrderPayments.findOne(selector, options);
    },
    countOrderPaymentsByContextData: async (
      {
        context,
      }: {
        context: any;
      },
      options?: mongodb.FindOptions,
    ) => {
      const selector = buildFindByContextDataSelector(context);

      return OrderPayments.countDocuments(selector, options);
    },

    normalizedStatus,

    // Mutations

    create: async (doc: OrderPayment): Promise<OrderPayment> => {
      const { insertedId: orderPaymentId } = await OrderPayments.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
        status: null,
        context: doc.context || {},
      });

      const orderPayment = await OrderPayments.findOne(
        buildFindOrderPaymentByIdSelector(orderPaymentId),
      );

      return orderPayment;
    },

    logEvent: async (orderPaymentId: string, event: any): Promise<boolean> => {
      const date = new Date();
      const modifier = {
        $push: {
          log: {
            date,
            status: undefined,
            info: JSON.stringify(event),
          },
        },
      };
      await OrderPayments.updateOne(generateDbFilterById(orderPaymentId), modifier);

      return true;
    },

    markAsPaid: async (orderPayment: OrderPayment, meta: any) => {
      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) return;

      await updateStatus(orderPayment._id, {
        status: OrderPaymentStatus.PAID,
        info: meta ? JSON.stringify(meta) : 'mark paid manually',
      });
      await emit('ORDER_PAY', { orderPayment });
    },

    updateContext: async (orderPaymentId: string, context: any): Promise<OrderPayment> => {
      const selector = buildFindOrderPaymentByIdSelector(orderPaymentId);
      if (!context || Object.keys(context).length === 0) return OrderPayments.findOne(selector, {});

      const contextSetters = Object.fromEntries(
        Object.entries(context).map(([key, value]) => [`context.${key}`, value]),
      );
      const result = await OrderPayments.findOneAndUpdate(
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
        await emit('ORDER_UPDATE_PAYMENT', {
          orderPayment: result.value,
        });
        return result.value;
      }

      return null;
    },

    updateStatus,

    updateCalculation: async <T extends PricingCalculation>(
      orderPaymentId: string,
      calculation: Array<T>,
    ) => {
      return OrderPayments.findOneAndUpdate(
        buildFindOrderPaymentByIdSelector(orderPaymentId),
        {
          $set: {
            calculation,
            updated: new Date(),
          },
        },
        {
          returnDocument: 'after',
        },
      );
    },
    deleteOrderPayments: async (orderId: string) => {
      const { deletedCount } = await OrderPayments.deleteMany({ orderId });
      return deletedCount;
    },
  };
};

export type OrderPaymentsModule = ReturnType<typeof configureOrderPaymentsModule>;
