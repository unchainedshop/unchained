import { Collection, Filter, ModuleMutations, Query, Update } from '@unchainedshop/types/common';
import { OrdersModule } from '@unchainedshop/types/orders';
import {
  OrderPayment,
  OrderPaymentsModule,
  OrderPaymentStatus,
} from '@unchainedshop/types/orders.payments';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { OrderPaymentsSchema } from '../db/OrderPaymentsSchema';

const ORDER_PAYMENT_EVENTS: string[] = ['ORDER_UPDATE_PAYMENT', 'ORDER_SIGN_PAYMENT', 'ORDER_PAY'];

const buildFindByIdSelector = (orderPaymentId: string) =>
  generateDbFilterById(orderPaymentId) as Filter<OrderPayment>;

const buildFindByContextDataSelector = (context: any): Query => {
  const contextKeys = Object.keys(context);

  if (contextKeys.length === 0) return null;

  const selector: Query = contextKeys.reduce(
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
  OrderPayments: Collection<OrderPayment>;
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

  const buildPaymentProviderActionsContext = (orderPayment: OrderPayment, transactionContext) => ({
    paymentProviderId: orderPayment.paymentProviderId,
    paymentContext: {
      orderPayment,
      transactionContext: {
        ...(transactionContext || {}),
        ...(orderPayment.context || {}),
      },
    },
  });

  const updateStatus: OrderPaymentsModule['updateStatus'] = async (
    orderPaymentId,
    { status, transactionId, info },
    userId,
  ) => {
    log(`OrderPayment ${orderPaymentId} -> New Status: ${status}`);

    const date = new Date();
    const modifier: Update<OrderPayment> = {
      $set: { status, updated: new Date(), updatedBy: userId },
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };
    if (transactionId) {
      modifier.$set.transactionId = transactionId;
    }
    if (status === OrderPaymentStatus.PAID) {
      modifier.$set.paid = date;
    }

    const selector = buildFindByIdSelector(orderPaymentId);
    await OrderPayments.updateOne(selector, modifier);
    return OrderPayments.findOne(selector, {});
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

    isBlockingOrderConfirmation: async (orderPayment, requestContext) => {
      if (orderPayment.status === OrderPaymentStatus.PAID) return false;

      const provider = await requestContext.modules.payment.paymentProviders.findProvider({
        paymentProviderId: orderPayment.paymentProviderId,
      });

      const isPayLaterAllowed = await requestContext.modules.payment.paymentProviders.isPayLaterAllowed(
        provider,
        requestContext,
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

    create: async (doc, userId) => {
      const orderPaymentId = await mutations.create(
        { ...doc, status: null, context: doc.context || {} },
        userId,
      );

      const orderPayment = await OrderPayments.findOne(buildFindByIdSelector(orderPaymentId));

      return orderPayment;
    },

    confirm: async (orderPayment, { transactionContext }, requestContext) => {
      const { services } = requestContext;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
        return orderPayment;
      }

      const arbitraryResponseData = await services.payment.confirm(
        buildPaymentProviderActionsContext(orderPayment, transactionContext),
        requestContext,
      );

      if (arbitraryResponseData) {
        return updateStatus(
          orderPayment._id,
          {
            status: OrderPaymentStatus.PAID,
            info: JSON.stringify(arbitraryResponseData),
          },
          requestContext.userId,
        );
      }

      return orderPayment;
    },

    cancel: async (orderPayment, { transactionContext }, requestContext) => {
      const { services } = requestContext;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
        return orderPayment;
      }

      const arbitraryResponseData = await services.payment.cancel(
        buildPaymentProviderActionsContext(orderPayment, transactionContext),
        requestContext,
      );

      if (arbitraryResponseData) {
        return updateStatus(
          orderPayment._id,
          {
            status: OrderPaymentStatus.REFUNDED,
            info: JSON.stringify(arbitraryResponseData),
          },
          requestContext.userId,
        );
      }

      return orderPayment;
    },

    charge: async (orderPayment, { transactionContext }, requestContext) => {
      const { services } = requestContext;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) {
        return orderPayment;
      }

      const arbitraryResponseData = await services.payment.charge(
        buildPaymentProviderActionsContext(orderPayment, transactionContext),
        requestContext,
      );

      if (arbitraryResponseData) {
        const { transactionId, ...info } = arbitraryResponseData;
        return updateStatus(
          orderPayment._id,
          {
            transactionId,
            status: OrderPaymentStatus.PAID,
            info: JSON.stringify(info),
          },
          requestContext.userId,
        );
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

    markAsPaid: async (orderPayment, meta, userId) => {
      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) return;

      await updateStatus(
        orderPayment._id,
        {
          status: OrderPaymentStatus.PAID,
          info: meta ? JSON.stringify(meta) : 'mark paid manually',
        },
        userId,
      );
      emit('ORDER_PAY', { orderPayment });
    },

    updateContext: async (orderPaymentId, context, requestContext) => {
      const selector = buildFindByIdSelector(orderPaymentId);
      const orderPayment = await OrderPayments.findOne(selector, {});
      const { orderId } = orderPayment;

      log(`OrderPayment ${orderPaymentId} -> Update Context`, {
        orderId,
        context,
      });
      const result = await OrderPayments.updateOne(selector, {
        $set: {
          context: { ...(orderPayment.context || {}), ...context },
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      if (result.modifiedCount) {
        await updateCalculation(orderId, requestContext);
        emit('ORDER_UPDATE_PAYMENT', {
          orderPayment: {
            ...orderPayment,
            context: { ...(orderPayment.context || {}), ...context },
          },
        });
        return true;
      }

      return false;
    },

    updateStatus,

    updateCalculation: async (orderPayment, requestContext) => {
      log(`OrderPayment ${orderPayment._id} -> Update Calculation`, {
        orderId: orderPayment.orderId,
      });

      const calculation = await requestContext.modules.payment.paymentProviders.calculate(
        {
          item: orderPayment,
        },
        requestContext,
      );

      const selector = buildFindByIdSelector(orderPayment._id);
      await OrderPayments.updateOne(selector, {
        $set: {
          calculation,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      return OrderPayments.findOne(selector);
    },
  };
};
