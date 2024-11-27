import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { Order, OrderDiscount, OrderPayment, OrderPaymentStatus } from '../types.js';
import { OrderPricingDiscount } from '../director/OrderPricingDirector.js';
import {
  PaymentPricingDirector,
  PaymentPricingSheet,
  type IPaymentPricingSheet,
} from '@unchainedshop/core-payment';

export type OrderPaymentsModule = {
  // Queries
  findOrderPayment: (
    params: {
      orderPaymentId: string;
    },
    options?: mongodb.FindOptions,
  ) => Promise<OrderPayment>;

  findOrderPaymentByContextData: (
    params: {
      context: any;
    },
    options?: mongodb.FindOptions,
  ) => Promise<OrderPayment>;

  countOrderPaymentsByContextData: (
    params: {
      context: any;
    },
    options?: mongodb.FindOptions,
  ) => Promise<number>;

  // Transformations
  discounts: (
    orderPayment: OrderPayment,
    params: { order: Order; orderDiscount: OrderDiscount },
    unchainedAPI,
  ) => Array<OrderPricingDiscount>;
  isBlockingOrderConfirmation: (orderPayment: OrderPayment, unchainedAPI) => Promise<boolean>;
  isBlockingOrderFullfillment: (orderPayment: OrderPayment) => boolean;
  normalizedStatus: (orderPayment: OrderPayment) => string;
  pricingSheet: (orderPayment: OrderPayment, currency: string) => IPaymentPricingSheet;

  // Mutations
  create: (doc: OrderPayment) => Promise<OrderPayment>;

  cancel: (
    orderPayment: OrderPayment,
    paymentContext: {
      transactionContext: any;
      userId: string;
    },
    unchainedAPI,
  ) => Promise<OrderPayment>;

  confirm: (
    orderPayment: OrderPayment,
    paymentContext: {
      transactionContext: any;
      userId: string;
    },
    unchainedAPI,
  ) => Promise<OrderPayment>;

  charge: (
    orderPayment: OrderPayment,
    paymentContext: {
      transactionContext: any;
      userId: string;
    },
    unchainedAPI,
  ) => Promise<OrderPayment>;

  logEvent: (orderPaymentId: string, event: any) => Promise<boolean>;

  markAsPaid: (payment: OrderPayment, meta: any) => Promise<void>;

  updateContext: (orderPaymentId: string, context: any) => Promise<OrderPayment | null>;

  updateStatus: (
    orderPaymentId: string,
    params: { transactionId?: string; status: OrderPaymentStatus; info?: string },
  ) => Promise<OrderPayment>;

  updateCalculation: (orderPayment: OrderPayment, unchainedAPI) => Promise<OrderPayment>;
};

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
}): OrderPaymentsModule => {
  registerEvents(ORDER_PAYMENT_EVENTS);

  const normalizedStatus: OrderPaymentsModule['normalizedStatus'] = (orderPayment) => {
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

  const updateStatus: OrderPaymentsModule['updateStatus'] = async (
    orderPaymentId,
    { status, transactionId, info },
  ) => {
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
    findOrderPayment: async ({ orderPaymentId }, options) => {
      return OrderPayments.findOne(buildFindByIdSelector(orderPaymentId), options);
    },
    findOrderPaymentByContextData: async ({ context }, options) => {
      const selector = buildFindByContextDataSelector(context);

      return OrderPayments.findOne(selector, options);
    },
    countOrderPaymentsByContextData: async ({ context }, options) => {
      const selector = buildFindByContextDataSelector(context);

      return OrderPayments.countDocuments(selector, options);
    },
    // Transformations
    discounts: (orderPayment, { order, orderDiscount }, context) => {
      const { modules } = context;
      if (!orderPayment) return [];
      const pricingSheet = modules.orders.payments.pricingSheet(orderPayment, order.currency);
      return pricingSheet.discountPrices(orderDiscount._id).map((discount) => ({
        payment: orderPayment,
        ...discount,
      }));
    },

    isBlockingOrderConfirmation: async (orderPayment, unchainedAPI) => {
      if (orderPayment.status === OrderPaymentStatus.PAID) return false;

      const provider = await unchainedAPI.modules.payment.paymentProviders.findProvider({
        paymentProviderId: orderPayment.paymentProviderId,
      });

      const isPayLaterAllowed = await unchainedAPI.modules.payment.paymentProviders.isPayLaterAllowed(
        provider,
        unchainedAPI,
      );

      return !isPayLaterAllowed;
    },
    isBlockingOrderFullfillment: (orderPayment) => {
      if (orderPayment.status === OrderPaymentStatus.PAID) return false;
      return true;
    },

    normalizedStatus,

    pricingSheet: (orderPayment, currency) => {
      return PaymentPricingSheet({
        calculation: orderPayment.calculation,
        currency,
      });
    },

    // Mutations

    create: async (doc) => {
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

    confirm: async (orderPayment, paymentContext, unchainedAPI) => {
      const { modules } = unchainedAPI;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
        return orderPayment;
      }

      const arbitraryResponseData = await modules.payment.paymentProviders.confirm(
        orderPayment.paymentProviderId,
        buildPaymentProviderActionsContext(orderPayment, paymentContext),
        unchainedAPI,
      );

      if (arbitraryResponseData) {
        return updateStatus(orderPayment._id, {
          status: OrderPaymentStatus.PAID,
          info: JSON.stringify(arbitraryResponseData),
        });
      }

      return orderPayment;
    },

    cancel: async (orderPayment, paymentContext, unchainedAPI) => {
      const { modules } = unchainedAPI;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
        return orderPayment;
      }

      const arbitraryResponseData = await modules.payment.paymentProviders.cancel(
        orderPayment.paymentProviderId,
        buildPaymentProviderActionsContext(orderPayment, paymentContext),
        unchainedAPI,
      );

      if (arbitraryResponseData) {
        return updateStatus(orderPayment._id, {
          status: OrderPaymentStatus.REFUNDED,
          info: JSON.stringify(arbitraryResponseData),
        });
      }

      return orderPayment;
    },

    charge: async (orderPayment, context, unchainedAPI) => {
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

      const result = await modules.payment.paymentProviders.charge(
        orderPayment.paymentProviderId,
        paymentContext,
        unchainedAPI,
      );

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

    logEvent: async (orderPaymentId, event) => {
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

    markAsPaid: async (orderPayment, meta) => {
      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) return;

      await updateStatus(orderPayment._id, {
        status: OrderPaymentStatus.PAID,
        info: meta ? JSON.stringify(meta) : 'mark paid manually',
      });
      await emit('ORDER_PAY', { orderPayment });
    },

    updateContext: async (orderPaymentId, context) => {
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

    updateCalculation: async (orderPayment, unchainedAPI) => {
      const pricing = await PaymentPricingDirector.actions(
        {
          item: orderPayment,
        },
        unchainedAPI,
      );
      const calculation = await pricing.calculate();

      return OrderPayments.findOneAndUpdate(
        buildFindByIdSelector(orderPayment._id),
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
