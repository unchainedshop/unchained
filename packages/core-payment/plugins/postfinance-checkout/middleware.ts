import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { Context } from '@unchainedshop/types/api';
import { createLogger } from 'meteor/unchained:logger';
import { WebhookData } from './types';
import { getTransaction } from './api';
import { orderIsPaid } from './utils';

const { PFCHECKOUT_WEBHOOK_PATH = '/graphql/postfinance-checkout' } = process.env;

const logger = createLogger('unchained:core-payment:postfinance-checkout');

useMiddlewareWithCurrentContext(PFCHECKOUT_WEBHOOK_PATH, bodyParser.json());

useMiddlewareWithCurrentContext(PFCHECKOUT_WEBHOOK_PATH, async (req, res) => {
  const context = req.unchainedContext as Context;
  const data = req.body as WebhookData;
  if (data.listenerEntityTechnicalName === 'TransactionCompletion') {
    const transactionId = data.entityId;
    try {
      const transaction = await getTransaction(transactionId);
      if (await orderIsPaid(transaction, context.modules.orders)) {
        const { orderPaymentId } = transaction.metaData as { orderPaymentId: string };
        const orderPayment = await context.modules.orders.payments.findOrderPayment({
          orderPaymentId,
        });
        const order = await context.modules.orders.findOrder({ orderId: orderPayment.orderId });
        await context.modules.orders.checkout(
          order,
          {
            transactionContext: {
              postfinanceTransactionId: transactionId,
            },
            paymentContext: {
              postfinanceTransactionId: transactionId,
            },
          },
          context,
        );
        logger.info(
          `PostFinance Checkout Webhook: Transaction ${transactionId} marked order payment ID ${transaction.metaData.orderPaymentId} as paid`,
        );
        res.writeHead(200);
        res.end(`Order marked as paid`);
      } else {
        logger.info(
          `PostFinance Checkout Webhook: Invalid transaction ${transactionId} with order payment ID ${transaction.metaData.orderPaymentId} not marked as paid`,
        );
        res.writeHead(200);
        res.end(`Order not marked as paid`);
      }
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
