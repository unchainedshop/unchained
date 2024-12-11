import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { WebhookData } from './types.js';
import { getTransaction, getTransactionCompletion } from './api.js';

const logger = createLogger('unchained:core-payment:postfinance-checkout');

export const postfinanceCheckoutHandler = async (req, res) => {
  const context = req.unchainedContext as Context;
  const { services, modules } = context;
  const data = req.body as WebhookData;
  if (data.listenerEntityTechnicalName === 'TransactionCompletion') {
    try {
      const transactionCompletion = await getTransactionCompletion(data.entityId as unknown as string);
      const transaction = await getTransaction(
        transactionCompletion.linkedTransaction as unknown as string,
      );
      const { orderPaymentId } = transaction.metaData as { orderPaymentId: string };
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId,
      });
      if (!orderPayment) throw new Error('Order Payment not found');

      const order = await services.orders.checkoutOrder(
        orderPayment.orderId,
        {
          paymentContext: {
            transactionId: transactionCompletion.linkedTransaction,
          },
        },
        context,
      );
      logger.info(
        `PostFinance Checkout Webhook: Transaction ${transactionCompletion.linkedTransaction} marked order payment ID ${transaction.metaData.orderPaymentId} as paid`,
      );
      res.writeHead(200);
      res.end(`Order marked as paid: ${order.orderNumber}`);
    } catch (e) {
      logger.error(`PostFinance Checkout Webhook: Unchained rejected to checkout with message`, e);
      res.writeHead(500);
      res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
    }
  } else {
    logger.error(
      `PostFinance Checkout Webhook: Received unknown listenerEntityTechnicalName ${data.listenerEntityTechnicalName}`,
    );
    res.writeHead(404);
    res.end();
  }
};
