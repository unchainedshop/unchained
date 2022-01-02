import { Context } from '@unchainedshop/types/api';
import {
  Collection,
  Filter,
  ModuleMutations,
} from '@unchainedshop/types/common';
import {
  OrderPaymentsModule,
  OrderPayment,
} from '@unchainedshop/types/orders.payments';
import { PaymentPricingDirector } from 'meteor/unchained:core-payment';
import { PaymentDirector } from 'meteor/unchained:core-payment';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
  objectInvert,
} from 'meteor/unchained:utils';
import { OrderPaymentsSchema } from '../db/OrderPaymentsSchema';
import { OrderPaymentStatus } from '../db/OrderPaymentStatus';
import { OrderPricingSheet } from '../director/OrderPricingSheet';

const ORDER_PAYMENT_EVENTS: string[] = ['ORDER_SIGN_PAYMENT', 'ORDER_PAY'];

const buildFindByIdSelector = (orderPaymentId: string) =>
  generateDbFilterById(orderPaymentId) as Filter<OrderPayment>;

export const configureOrderPaymentsModule = async ({
  OrderPayments,
}: {
  OrderPayments: Collection<OrderPayment>;
}): Promise<OrderPaymentsModule> => {
  registerEvents(ORDER_PAYMENT_EVENTS);

  const mutations = generateDbMutations<OrderPayment>(
    OrderPayments,
    OrderPaymentsSchema
  ) as ModuleMutations<OrderPayment>;

  const updateCalculation: OrderPaymentsModule['updateCalculation'] = async (
    orderPayment,
    requestContext
  ) => {
    log(`OrderPayment ${orderPayment._id} -> Update Calculation`, {
      orderId: orderPayment.orderId,
    });

    const pricing = PaymentPricingDirector.actions(
      {
        item: orderPayment,
      },
      requestContext
    );
    const calculation = await pricing.calculate();

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
  };

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

  const getDirector = async (
    orderPayment: OrderPayment,
    paymentContext: any,
    requestContext: Context
  ) => {
    const provider =
      await requestContext.modules.payment.paymentProviders.findProvider({
        paymentProviderId: orderPayment.paymentProviderId,
      });
    const director = PaymentDirector.actions(
      provider,
      paymentContext,
      requestContext
    );

    return director;
  };

  return {
    // Queries
    findOrderPayment: async ({ orderPaymentId }) => {
      return await OrderPayments.findOne(buildFindByIdSelector(orderPaymentId));
    },

    // Transformations
    isBlockingOrderConfirmation: async (orderPayment, requestContext) => {
      if (orderPayment.status === OrderPaymentStatus.PAID) return false;

      const director = await getDirector(orderPayment, {}, requestContext);

      if (director.isPayLaterAllowed()) return false;
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

    delete: async (orderPaymentId, userId) => {
      const deletedCount = await mutations.delete(orderPaymentId, userId);
      return deletedCount;
    },

    sign: async (orderPayment, paymentContext, requestContext) => {
      const director = await getDirector(
        orderPayment,
        paymentContext,
        requestContext
      );

      const result = await director.sign({
        paymentContext,
        orderPayment,
      });

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
      await updateCalculation(orderPayment, requestContext);
      emit('ORDER_UPDATE_DELIVERY', { orderPayment });
      return orderPayment;
    },

    updateStatus,

    updateCalculation,
  };
};
