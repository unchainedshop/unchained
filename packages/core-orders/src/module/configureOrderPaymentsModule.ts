import { Context } from '@unchainedshop/types/api';
import {
  Collection,
  Filter,
  ModuleMutations,
} from '@unchainedshop/types/common';
import { OrdersModule } from '@unchainedshop/types/orders';
import {
  OrderPaymentsModule,
  OrderPayment,
} from '@unchainedshop/types/orders.payments';
// import { PaymentPricingDirector } from 'meteor/unchained:core-payment';
// import { PaymentDirector } from 'meteor/unchained:core-payment';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
  objectInvert,
  dbIdToString,
} from 'meteor/unchained:utils';
import { OrderPaymentsSchema } from '../db/OrderPaymentsSchema';
import { OrderPaymentStatus } from '../db/OrderPaymentStatus';
import { OrderPricingSheet } from '../director/OrderPricingSheet';

const ORDER_PAYMENT_EVENTS: string[] = ['ORDER_SIGN_PAYMENT', 'ORDER_PAY'];

const buildFindByIdSelector = (orderPaymentId: string) =>
  generateDbFilterById(orderPaymentId) as Filter<OrderPayment>;

export const configureOrderPaymentsModule = ({
  OrderPayments,
  updateCalculation,
}: {
  OrderPayments: Collection<OrderPayment>;
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderPaymentsModule => {
  registerEvents(ORDER_PAYMENT_EVENTS);

  const mutations = generateDbMutations<OrderPayment>(
    OrderPayments,
    OrderPaymentsSchema
  ) as ModuleMutations<OrderPayment>;

  const updateStatus: OrderPaymentsModule['updateStatus'] = async (
    orderPaymentId,
    { status, info },
    userId
  ) => {
    log(`OrderPayment ${orderPaymentId} -> New Status: ${status}`);

    const date = new Date();
    const modifier = {
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
      /* @ts-ignore */
      modifier.$set.paid = date;
    }

    const selector = buildFindByIdSelector(orderPaymentId);
    await OrderPayments.updateOne(selector, modifier);
    return await OrderPayments.findOne(selector);
  };

  return {
    // Queries
    findOrderPayment: async ({ orderPaymentId }) => {
      return await OrderPayments.findOne(buildFindByIdSelector(orderPaymentId));
    },

    // Transformations
    discounts: (orderPayment, { order, orderDiscount }, { modules }) => {
      if (!orderPayment) return [];

      const pricingSheet = modules.orders.payments.pricingSheet(
        orderPayment,
        order.currency
      );

      return pricingSheet
        .discountPrices(orderDiscount._id as string)
        .map((discount) => ({
          payment: orderPayment,
          ...discount,
        }));
    },

    isBlockingOrderConfirmation: async (orderPayment, requestContext) => {
      if (orderPayment.status === OrderPaymentStatus.PAID) return false;

      const isPayLaterAllowed =
        await requestContext.modules.payment.paymentProviders.isPayLaterAllowed(
          orderPayment.paymentProviderId,
          {},
          requestContext
        );

      if (isPayLaterAllowed) return false;

      return true;
    },
    isBlockingOrderFullfillment: (orderPayment) => {
      if (orderPayment.status === OrderPaymentStatus.PAID) return false;
      return true;
    },

    normalizedStatus: (orderPayment) => {
      return objectInvert(OrderPaymentStatus)[orderPayment.status || null];
    },
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
        userId
      );

      const orderPayment = await OrderPayments.findOne(
        buildFindByIdSelector(orderPaymentId)
      );

      return orderPayment;
    },

    charge: async (
      orderPayment,
      { transactionContext, order },
      requestContext
    ) => {
      if (orderPayment.status !== OrderPaymentStatus.OPEN) return orderPayment;

      const paymentProvider =
        await requestContext.modules.payment.paymentProviders.findProvider({
          paymentProviderId: orderPayment.paymentProviderId,
        });

      const paymentProviderId = dbIdToString(paymentProvider._id);

      const arbitraryResponseData =
        await requestContext.modules.payment.paymentProviders.charge(
          paymentProviderId,
          {
            order,
            orderPayment,
            transactionContext: {
              ...(transactionContext || {}),
              ...(orderPayment.context || {}),
            },
          },
          requestContext
        );

      if (arbitraryResponseData) {
        return await updateStatus(
          dbIdToString(orderPayment._id),
          {
            status: OrderPaymentStatus.PAID,
            info: JSON.stringify(arbitraryResponseData),
          },
          requestContext.userId
        );
      }

      return orderPayment;
    },

    delete: async (orderPaymentId, userId) => {
      const deletedCount = await mutations.delete(orderPaymentId, userId);
      return deletedCount;
    },

    logEvent: async (orderPaymentId, event, userId) => {
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
      await OrderPayments.updateOne(
        generateDbFilterById(orderPaymentId),
        modifier
      );

      return true;
    },

    markAsPaid: async (orderPayment, meta, userId) => {
      if (orderPayment.status !== OrderPaymentStatus.OPEN) return;

      updateStatus(
        orderPayment._id as string,
        {
          status: OrderPaymentStatus.PAID,
          info: meta ? JSON.stringify(meta) : 'mark paid manually',
        },
        userId
      );
      emit('ORDER_PAY', { orderPayment });
    },

    sign: async (orderPayment, paymentContext, requestContext) => {
      const result = await requestContext.modules.payment.paymentProviders.sign(
        orderPayment.paymentProviderId,
        paymentContext,
        requestContext
      );

      emit('ORDER_SIGN_PAYMENT', {
        orderPayment,
        paymentContext,
      });

      return result;
    },

    updateContext: async (
      orderPaymentId,
      { orderId, context },
      requestContext
    ) => {
      log(`OrderPayment ${orderPaymentId} -> Update Context`, {
        orderId,
      });

      const selector = buildFindByIdSelector(orderPaymentId);
      await OrderPayments.updateOne(selector, {
        $set: {
          context: context || {},
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const orderPayment = await OrderPayments.findOne(selector);
      await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE_DELIVERY', { orderPayment });
      return orderPayment;
    },

    updateStatus,

    updateCalculation: async (orderPayment, requestContext) => {
      log(`OrderPayment ${orderPayment._id} -> Update Calculation`, {
        orderId: orderPayment.orderId,
      });

      const calculation =
        await requestContext.modules.payment.paymentProviders.calculate(
          {
            item: orderPayment,
          },
          requestContext
        );

      await OrderPayments.updateOne(
        buildFindByIdSelector(orderPayment._id as string),
        {
          $set: {
            calculation,
            updated: new Date(),
            updatedBy: requestContext.userId,
          },
        }
      );

      return true;
    },
  };
};
