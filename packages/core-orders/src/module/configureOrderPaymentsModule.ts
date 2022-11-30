import { Collection, Filter, Query, Update } from '@unchainedshop/types/common';
import { ModuleMutations } from '@unchainedshop/types/core';

import { OrdersModule } from '@unchainedshop/types/orders';
import {
  OrderPayment,
  OrderPaymentsModule,
  OrderPaymentStatus,
} from '@unchainedshop/types/orders.payments';
import { emit, registerEvents } from '@unchainedshop/events';
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
  ) => {
    log(`OrderPayment ${orderPaymentId} -> New Status: ${status}`);

    const date = new Date();
    const modifier: Update<OrderPayment> = {
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

    confirm: async (orderPayment, { transactionContext }, unchainedAPI) => {
      const { services } = unchainedAPI;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
        return orderPayment;
      }

      const arbitraryResponseData = await services.payment.confirm(
        buildPaymentProviderActionsContext(orderPayment, transactionContext),
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

    cancel: async (orderPayment, { transactionContext }, unchainedAPI) => {
      const { services } = unchainedAPI;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
        return orderPayment;
      }

      const arbitraryResponseData = await services.payment.cancel(
        buildPaymentProviderActionsContext(orderPayment, transactionContext),
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

    charge: async (orderPayment, { transactionContext }, unchainedAPI) => {
      const { services } = unchainedAPI;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) {
        return orderPayment;
      }

      const arbitraryResponseData = await services.payment.charge(
        buildPaymentProviderActionsContext(orderPayment, transactionContext),
        unchainedAPI,
      );

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
      if (!context) return false;

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
        },
      });

      if (result.modifiedCount) {
        await updateCalculation(orderId, unchainedAPI);
        await emit('ORDER_UPDATE_PAYMENT', {
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

      const selector = buildFindByIdSelector(orderPayment._id);
      await OrderPayments.updateOne(selector, {
        $set: {
          calculation,
          updated: new Date(),
        },
      });

      return OrderPayments.findOne(selector);
    },
  };
};
