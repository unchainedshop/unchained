import { Context } from '@unchainedshop/types/api.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core-payment:payrexx:webhook');

export const payrexxHandler = async (request, response) => {
  const resolvedContext = request.unchainedContext as Context;
  const { modules } = resolvedContext;

  const { transaction } = request.body;

  if (!transaction) {
    logger.verbose(`unhandled event type`, {
      type: Object.keys(request.body).join(','),
    });
    response.writeHead(200);
    response.end({
      ignored: true,
      message: `Unhandled event type: ${Object.keys(request.body).join(',')}. Supported type: transaction`,
    });
  }

  logger.verbose(`Processing event`, {
    transactionId: transaction.id,
  });
  try {
    const { referenceId: orderPaymentId } = transaction;

    logger.verbose(`checkout with orderPaymentId: ${orderPaymentId}`);
    await modules.orders.payments.logEvent(orderPaymentId, {
      transactionId: transaction.id,
    });
    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId,
    });
    if (!orderPayment) {
      throw new Error(`order payment not found with orderPaymentId: ${orderPaymentId}`);
    }
    const order = await modules.orders.checkout(
      orderPayment.orderId,
      {
        paymentContext: {
          transactionId: transaction.id,
        },
      },
      resolvedContext,
    );
    logger.info(`checkout successful`, {
      orderPaymentId,
      orderId: order._id,
    });
    response.writeHead(200);
    response.end({
      message: 'checkout successful',
      orderId: order._id,
    });
  } catch (error) {
    logger.error(error, {
      transactionId: transaction.id,
    });
    response.writeHead(500);
    response.end(error.message);
  }
};
