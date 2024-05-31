import { ModuleMutations } from '@unchainedshop/types/core.js';
import { OrdersModule } from '@unchainedshop/types/orders.js';
import {
  OrderPayment,
  OrderPaymentsModule,
  OrderPaymentStatus,
} from '@unchainedshop/types/orders.payments.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { log } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations, mongodb } from '@unchainedshop/mongodb';
import { OrderPaymentsSchema } from '../db/OrderPaymentsSchema.js';

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
  updateCalculation,
}: {
  OrderPayments: mongodb.Collection<OrderPayment>;
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderPaymentsModule => {
  registerEvents(ORDER_PAYMENT_EVENTS);

  const mutations = generateDbMutations<OrderPayment>(OrderPayments, OrderPaymentsSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<OrderPayment>;

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
    log(`OrderPayment ${orderPaymentId} -> New Status: ${status}`);

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
      const pricingSheet = modules.orders.payments.pricingSheet(orderPayment, order.currency, context);
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

    pricingSheet: (orderPayment, currency, { modules }) => {
      return modules.payment.paymentProviders.pricingSheet({
        calculation: orderPayment.calculation,
        currency,
      });
    },

    // Mutations

    create: async (doc) => {
      const orderPaymentId = await mutations.create({
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

    updateContext: async (orderPaymentId, context, unchainedAPI) => {
      const selector = buildFindByIdSelector(orderPaymentId);
      if (!context || Object.keys(context).length === 0) return OrderPayments.findOne(selector, {});

      log(`OrderPayment ${orderPaymentId} -> Update Context`, {
        context,
      });
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
        await updateCalculation(result.value.orderId, unchainedAPI);
        await emit('ORDER_UPDATE_PAYMENT', {
          orderPayment: result.value,
        });
        return result.value;
      }

      return null;
    },

    updateStatus,

    updateCalculation: async (orderPayment, unchainedAPI) => {
      log(`OrderPayment ${orderPayment._id} -> Update Calculation`, {
        orderId: orderPayment.orderId,
      });

      const calculation = await unchainedAPI.modules.payment.paymentProviders.calculate(
        {
          item: orderPayment,
        },
        unchainedAPI,
      );

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
