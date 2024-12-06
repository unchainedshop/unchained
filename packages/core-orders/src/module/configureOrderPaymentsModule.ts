import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { Order, OrderDiscount, OrderPayment, OrderPaymentStatus } from '../types.js';
import { OrderPricingDiscount } from '../director/OrderPricingDirector.js';
import { PaymentDirector, PaymentPricingSheet, type IPaymentPricingSheet } from '@unchainedshop/core';
import { PricingCalculation } from '@unchainedshop/utils';

const ORDER_PAYMENT_EVENTS: string[] = ['ORDER_UPDATE_PAYMENT', 'ORDER_SIGN_PAYMENT', 'ORDER_PAY'];

export const buildFindByIdSelector = (orderPaymentId: string) =>
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

  const buildPaymentProviderActionsContext = (
    orderPayment: OrderPayment,
    { transactionContext, ...rest }: { transactionContext: any; userId: string },
  ) => ({
    ...rest,
    orderPayment,
    paymentProviderId: orderPayment.paymentProviderId,
    transactionContext: {
      ...(transactionContext || {}),
      ...(orderPayment.context || {}),
    },
  });

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

    const selector = buildFindByIdSelector(orderPaymentId);
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
      return OrderPayments.findOne(buildFindByIdSelector(orderPaymentId), options);
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
    // Transformations
    discounts: (
      orderPayment: OrderPayment,
      { order, orderDiscount }: { order: Order; orderDiscount: OrderDiscount },
    ): Array<OrderPricingDiscount> => {
      if (!orderPayment) return [];

      const pricingSheet = PaymentPricingSheet({
        calculation: orderPayment.calculation,
        currency: order.currency,
      });
      return pricingSheet.discountPrices(orderDiscount._id).map((discount) => ({
        payment: orderPayment,
        ...discount,
      }));
    },

    normalizedStatus,

    pricingSheet: (orderPayment: OrderPayment, currency: string): IPaymentPricingSheet => {
      return PaymentPricingSheet({
        calculation: orderPayment.calculation,
        currency,
      });
    },

    // Mutations

    create: async (doc: OrderPayment): Promise<OrderPayment> => {
      const { insertedId: orderPaymentId } = await OrderPayments.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
        status: null,
        context: doc.context || {},
      });

      const orderPayment = await OrderPayments.findOne(buildFindByIdSelector(orderPaymentId));

      return orderPayment;
    },

    confirm: async (
      orderPayment: OrderPayment,
      paymentContext: {
        transactionContext: any;
        userId: string;
      },
      unchainedAPI,
    ): Promise<OrderPayment> => {
      const { modules } = unchainedAPI;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
        return orderPayment;
      }

      const paymentProvider = await modules.payment.paymentProviders.findProvider({
        paymentProviderId: orderPayment.paymentProviderId,
      });
      const actions = await PaymentDirector.actions(
        paymentProvider,
        buildPaymentProviderActionsContext(orderPayment, paymentContext),
        unchainedAPI,
      );

      const arbitraryResponseData = await actions.confirm();

      if (arbitraryResponseData) {
        return updateStatus(orderPayment._id, {
          status: OrderPaymentStatus.PAID,
          info: JSON.stringify(arbitraryResponseData),
        });
      }

      return orderPayment;
    },

    cancel: async (
      orderPayment: OrderPayment,
      paymentContext: {
        transactionContext: any;
        userId: string;
      },
      unchainedAPI,
    ): Promise<OrderPayment> => {
      const { modules } = unchainedAPI;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
        return orderPayment;
      }

      const paymentProvider = await modules.payment.paymentProviders.findProvider({
        paymentProviderId: orderPayment.paymentProviderId,
      });
      const actions = await PaymentDirector.actions(
        paymentProvider,
        buildPaymentProviderActionsContext(orderPayment, paymentContext),
        unchainedAPI,
      );
      const arbitraryResponseData = await actions.cancel();

      if (arbitraryResponseData) {
        return updateStatus(orderPayment._id, {
          status: OrderPaymentStatus.REFUNDED,
          info: JSON.stringify(arbitraryResponseData),
        });
      }

      return orderPayment;
    },

    charge: async (
      orderPayment: OrderPayment,
      context: {
        transactionContext: any;
        userId: string;
      },
      unchainedAPI,
    ): Promise<OrderPayment> => {
      const { modules } = unchainedAPI;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) {
        return orderPayment;
      }

      const paymentCredentials =
        context.transactionContext?.paymentCredentials ||
        (await modules.payment.paymentCredentials.findPaymentCredential({
          userId: context.userId,
          paymentProviderId: orderPayment.paymentProviderId,
          isPreferred: true,
        }));

      const paymentContext = buildPaymentProviderActionsContext(orderPayment, {
        ...context,
        transactionContext: {
          ...context.transactionContext,
          paymentCredentials,
        },
      });

      const paymentProvider = await modules.payment.paymentProviders.findProvider({
        paymentProviderId: orderPayment.paymentProviderId,
      });
      const actions = await PaymentDirector.actions(paymentProvider, paymentContext, unchainedAPI);
      const result = await actions.charge();

      if (!result) return orderPayment;

      const { credentials, ...arbitraryResponseData } = result;

      if (credentials) {
        const { token, ...meta } = credentials;
        await modules.payment.paymentCredentials.upsertCredentials({
          userId: paymentContext.userId,
          paymentProviderId: orderPayment.paymentProviderId,
          token,
          ...meta,
        });
      }

      if (arbitraryResponseData) {
        const { transactionId, ...info } = arbitraryResponseData;
        return updateStatus(orderPayment._id, {
          transactionId,
          status: OrderPaymentStatus.PAID,
          info: JSON.stringify(info),
        });
      }

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
      const selector = buildFindByIdSelector(orderPaymentId);
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

    updateCalculation: async (orderPaymentId: string, calculation: Array<PricingCalculation>) => {
      return OrderPayments.findOneAndUpdate(
        buildFindByIdSelector(orderPaymentId),
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
  };
};

export type OrderPaymentsModule = ReturnType<typeof configureOrderPaymentsModule>;
