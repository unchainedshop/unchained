import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { WebhookData } from './types.js';
import { getTransaction, getTransactionCompletion } from './api.js';

const logger = createLogger('unchained:core-payment:postfinance-checkout:handler');

export const postfinanceCheckoutHandler = async (req, res) => {
  const context = req.unchainedContext as Context;
  const { services, modules } = context;
  const data = req.body as WebhookData;
  if (data.listenerEntityTechnicalName === 'TransactionCompletion') {
    try {
      const transactionCompletion = await getTransactionCompletion(data.entityId as unknown as string);
      const transaction = await getTransaction(
        transactionCompletion ? (transactionCompletion as any).linkedTransaction : data.entityId,
      );
      const { orderPaymentId } = transaction.metaData as { orderPaymentId: string };
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId,
      });
      if (!orderPayment) throw new Error('Order Payment not found');

      const order = await services.orders.checkoutOrder(orderPayment.orderId, {
        paymentContext: {
          transactionId: transactionCompletion.linkedTransaction,
        },
      });
      logger.info(
        `Transaction ${transactionCompletion.linkedTransaction} marked order payment ID ${transaction.metaData?.orderPaymentId} as paid`,
      );
      res.status(200).send(`Order marked as paid: ${order.orderNumber}`);
    } catch (e) {
      logger.error(e);
      res.status(500).send({ name: e.name, code: e.code, message: e.message });
    }
  } else {
    logger.error(`Received unknown listenerEntityTechnicalName ${data.listenerEntityTechnicalName}`);
    res.status(404).end();
  }
};
