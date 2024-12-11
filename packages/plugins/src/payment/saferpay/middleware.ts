import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { buildSignature } from './buildSignature.js';
import { SaferpayTransactionsModule } from './module/configureSaferpayTransactionsModule.js';

const logger = createLogger('unchained:core-payment:saferpay:webhook');

export const saferpayHandler = async (request, response) => {
  const resolvedContext = request.unchainedContext as Context & {
    modules: { saferpayTransactions: SaferpayTransactionsModule };
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
    response.writeHead(404);
    response.end();
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

    const order = await services.orders.checkoutOrder(
      orderPayment.orderId,
      {
        paymentContext: {
          transactionId,
        },
      },
      resolvedContext,
    );
    logger.info(`checkout successful`, {
      orderPaymentId,
      orderId: order._id,
    });
    response.writeHead(200);
    response.end(
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
    response.writeHead(500);
    response.end(error.message);
  }
};
