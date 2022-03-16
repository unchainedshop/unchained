import { Collection, Filter, ModuleMutations, Query, Update } from '@unchainedshop/types/common';
import { OrdersModule } from '@unchainedshop/types/orders';
import { OrderPayment, OrderPaymentsModule } from '@unchainedshop/types/orders.payments';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { OrderPaymentsSchema } from '../db/OrderPaymentsSchema';
import { OrderPaymentStatus } from '../db/OrderPaymentStatus';
import { OrderPricingSheet } from '../director/OrderPricingSheet';

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
  }) as ModuleMutations<OrderPayment>;

  const normalizedStatus: OrderPaymentsModule['normalizedStatus'] = (orderPayment) => {
    return orderPayment.status === null
      ? OrderPaymentStatus.OPEN
      : (orderPayment.status as OrderPaymentStatus);
  };

  const updateStatus: OrderPaymentsModule['updateStatus'] = async (
    orderPaymentId,
    { status, info },
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

      return OrderPayments.count(selector, options);
    },
    // Transformations
    discounts: (orderPayment, { order, orderDiscount }, { modules }) => {
      if (!orderPayment) return [];

      const pricingSheet = modules.orders.payments.pricingSheet(orderPayment, order.currency);

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

      const isPayLaterAllowed = requestContext.modules.payment.paymentProviders.isPayLaterAllowed(
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
    pricingSheet: (orderPayment, currency) => {
      return OrderPricingSheet({
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

    charge: async (orderPayment, { transactionContext, order }, requestContext) => {
      const { modules, services } = requestContext;

      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) {
        return orderPayment;
      }

      const paymentProvider = await modules.payment.paymentProviders.findProvider({
        paymentProviderId: orderPayment.paymentProviderId,
      });

      const paymentProviderId = paymentProvider._id;

      const arbitraryResponseData = await services.payment.charge(
        {
          paymentProviderId,
          paymentContext: {
            order,
            orderPayment,
            transactionContext: {
              ...(transactionContext || {}),
              ...(orderPayment.context || {}),
            },
          },
        },
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

    updateContext: async (orderPaymentId, { orderId, context }, requestContext) => {
      log(`OrderPayment ${orderPaymentId} -> Update Context`, {
        orderId,
        context,
      });

      const selector = buildFindByIdSelector(orderPaymentId);
      await OrderPayments.updateOne(selector, {
        $set: {
          context: context || {},
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const orderPayment = await OrderPayments.findOne(selector, {});
      await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE_PAYMENT', { orderPayment });
      return orderPayment;
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
