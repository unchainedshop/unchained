import type { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { buildSignature } from './buildSignature.ts';
import type { SaferpayTransactionsModule } from './module.ts';

const logger = createLogger('unchained:saferpay:handler');

export const saferpayHandler = async (request, response) => {
  const resolvedContext = request.unchainedContext as Context & {
    modules: SaferpayTransactionsModule;
  };
  const { modules, services } = resolvedContext;

  const { orderPaymentId, signature, transactionId } = request.query;
  const isValidRequest =
    typeof orderPaymentId === 'string' &&
    typeof signature === 'string' &&
    typeof transactionId === 'string' &&
    orderPaymentId &&
    transactionId &&
    signature;

  if ((request.method !== 'GET' && request.method !== 'HEAD') || !isValidRequest) {
    logger.warn(`unhandled http method ${request.method} or orderPaymentId missing in query`);
    response.status(404).end();
    return;
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

    if (!order) throw new Error(`Order with id ${orderPayment.orderId} not found`);

    logger.info(`checkout successful`, {
      orderPaymentId,
      orderId: order._id,
    });
    response.status(200).send({
      message: 'checkout successful',
      orderPaymentId,
      orderId: order._id,
    });
  } catch (error) {
    logger.error(error, {
      orderPaymentId,
      transactionId,
    });
    response.status(500).send({
      message: error.message,
      name: error.name,
    });
  }
};
