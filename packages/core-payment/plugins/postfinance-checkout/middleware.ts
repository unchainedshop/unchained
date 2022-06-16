import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { Context } from '@unchainedshop/types/api';
import { createLogger } from '@unchainedshop/logger';
import { WebhookData } from './types';
import { getTransaction, getTransactionCompletion } from './api';

const { PFCHECKOUT_WEBHOOK_PATH = '/graphql/postfinance-checkout' } = process.env;

const logger = createLogger('unchained:core-payment:postfinance-checkout');

useMiddlewareWithCurrentContext(PFCHECKOUT_WEBHOOK_PATH, bodyParser.json());

useMiddlewareWithCurrentContext(PFCHECKOUT_WEBHOOK_PATH, async (req, res) => {
  const context = req.unchainedContext as Context;
  const data = req.body as WebhookData;
  if (data.listenerEntityTechnicalName === 'TransactionCompletion') {
    try {
      const transactionCompletion = await getTransactionCompletion(data.entityId as unknown as string);
      const transaction = await getTransaction(
        transactionCompletion.linkedTransaction as unknown as string,
      );
      const { orderPaymentId } = transaction.metaData as { orderPaymentId: string };
      const orderPayment = await context.modules.orders.payments.findOrderPayment({
        orderPaymentId,
      });
      if (!orderPayment) throw new Error('Order Payment not found');
      const order = await context.modules.orders.checkout(
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
      res.end(JSON.stringify(e));
    }
  } else {
    logger.error(
      `PostFinance Checkout Webhook: Received unknown listenerEntityTechnicalName ${data.listenerEntityTechnicalName}`,
    );
    res.writeHead(404);
    res.end();
  }
});
