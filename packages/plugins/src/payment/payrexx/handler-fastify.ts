import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:core-payment:payrexx:handler');

export const payrexxHandler: RouteHandlerMethod = async (
  request: FastifyRequest & {
    unchainedContext: Context;
  },
  reply,
) => {
  const resolvedContext = request.unchainedContext as Context;
  const { modules, services } = resolvedContext;

  const { transaction } = request.body as Record<string, any>;

  if (!transaction) {
    logger.info(`unhandled event type`, {
      type: Object.keys(request.body).join(','),
    });
    reply.status(200);
    return reply.send(
      JSON.stringify({
        ignored: true,
        message: `Unhandled event type: ${Object.keys(request.body).join(',')}. Supported type: transaction`,
      }),
    );
  }
  if (transaction.referenceId === '__IGNORE_WEBHOOK__' || transaction.status === 'waiting') {
    // Ignore confirmed transactions, because those hooks are generated through calling the confirm()
    // method in the payment adapter and could lead to double bookings.
    logger.info(`unhandled transaction state: ${transaction.status}`);
    reply.status(200);
    return reply.send(
      JSON.stringify({
        ignored: true,
        message: `Unhandled transaction state: ${transaction.status}`,
      }),
    );
  }

  logger.info(`Processing event`, {
    transactionId: transaction.id,
  });
  try {
    if (transaction.preAuthorizationId) {
      // Pre-Authorization Flow, referenceId is a userId
      const { referenceId: paymentProviderId, invoice } = transaction;
      const userId = '';
      logger.info(`register credentials for: ${userId}`);
      await services.orders.registerPaymentCredentials(paymentProviderId, {
        userId,
        transactionContext: { gatewayId: invoice.paymentRequestId },
      });
      logger.info(`registration successful`, {
        paymentProviderId,
        userId,
      });
      reply.status(200);
      return reply.send(
        JSON.stringify({
          message: 'registration successful',
          paymentProviderId,
          userId,
        }),
      );
    } else {
      const { referenceId: orderPaymentId, invoice } = transaction;
      logger.info(`checkout with orderPaymentId: ${orderPaymentId}`);
      await modules.orders.payments.logEvent(orderPaymentId, {
        transactionId: transaction.id,
      });
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId,
      });
      if (!orderPayment) {
        throw new Error(`order payment not found with orderPaymentId: ${orderPaymentId}`);
      }

      const order = await services.orders.checkoutOrder(orderPayment.orderId, {
        paymentContext: {
          gatewayId: invoice.paymentRequestId,
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
          orderId: order._id,
        }),
      );
    }
  } catch (error) {
    logger.error(error, {
      transactionId: transaction.id,
    });
    reply.status(500);
    return reply.send(error.message);
  }
};
