import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { buildSignature } from './buildSignature.js';
import { SaferpayTransactionsModule } from './module.js';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:core-payment:saferpay:handler');

export const saferpayHandler: RouteHandlerMethod = async (
  request: FastifyRequest & {
    unchainedContext: Context;
  },
  reply,
) => {
  const resolvedContext = request.unchainedContext as Context & {
    modules: SaferpayTransactionsModule;
  };
  const { modules, services } = resolvedContext;

  const { orderPaymentId, signature, transactionId } = request.query as Record<string, string>;
  const isValidRequest =
    typeof orderPaymentId === 'string' &&
    typeof signature === 'string' &&
    typeof transactionId === 'string' &&
    orderPaymentId &&
    transactionId &&
    signature;

  if (!isValidRequest) {
    logger.warn(`orderPaymentId missing in query`);
    reply.status(404);
    return reply.send();
  }

  try {
    logger.info(`checkout with orderPaymentId: ${orderPaymentId}`);
    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId,
    });
    if (!orderPayment) {
      throw new Error(`order payment not found with orderPaymentId: ${orderPaymentId}`);
    }

    const correctSignature = await buildSignature(transactionId, orderPaymentId);

    if (correctSignature !== signature) {
      throw new Error('Invalid signature');
    }

    const order = await services.orders.checkoutOrder(orderPayment.orderId, {
      paymentContext: {
        transactionId,
      },
    });
    logger.info(`checkout successful`, {
      orderPaymentId,
      orderId: order._id,
    });
    reply.status(200);
    return reply.send(
      JSON.stringify({
        message: 'checkout successful',
        orderPaymentId,
        orderId: order._id,
      }),
    );
  } catch (error) {
    logger.error(error, {
      orderPaymentId,
      transactionId,
    });
    reply.status(500);
    return reply.send(error.message);
  }
};
