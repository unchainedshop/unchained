import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { OrderPricingSheet } from 'meteor/unchained:core-orders';
import { Context } from '@unchainedshop/types/api';
import { createLogger } from 'meteor/unchained:logger';
import { WebhookData } from './types';
import { getTransaction } from './api';
import { transactionIsPaid } from './utils';

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
      const { orderPaymentId } = transaction.metaData;
      const orderPayment = await context.modules.orders.payments.findOrderPayment({
        orderPaymentId,
      });
      const order = await context.modules.orders.findOrder({ orderId: orderPayment.orderId });
      const pricing = OrderPricingSheet({
        calculation: order.calculation,
        currency: order.currency,
      });
      const totalAmount = pricing?.total({ useNetPrice: false }).amount / 100;
      if (transactionIsPaid(transactionId, order.currency, totalAmount)) {
        await context.modules.orders.payments.markAsPaid(orderPayment, { transactionId });
        res.writeHead(200);
        logger.info(
          `PostFinance Checkout Webhook: Unchained confirmed checkout for order ${order.orderNumber}`,
          {
            orderId: order._id,
          },
        );
        res.end(JSON.stringify(order));
      } else {
        logger.info(`PostFinance Checkout Webhook: Order ${order.orderNumber} not marked as paid`);
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
