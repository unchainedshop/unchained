import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/api';
import generateSignature, { Security } from './generateSignature.js';
import { StatusResponseSuccess } from './api/types.js';

const {
  DATATRANS_SIGN_KEY,
  DATATRANS_SIGN2_KEY,
  DATATRANS_SECURITY = Security.DYNAMIC_SIGN,
} = process.env;

const logger = createLogger('unchained:datatrans:handler');

export const datatransHandler = async (req, res) => {
  const resolvedContext = req.unchainedContext as Context;
  const { modules, services } = resolvedContext;
  const signature = req.headers['datatrans-signature'];

  if (!DATATRANS_SIGN_KEY && !DATATRANS_SIGN2_KEY) {
    logger.warn('No sign key configured');
    res.status(404).end();
    return;
  }

  if (req.method === 'POST' && signature) {
    const [rawTimestamp, rawHash] = signature.split(',');
    const [, hash] = rawHash.split('=');
    const [, timestamp] = rawTimestamp.split('=');

    const comparableSignature = await generateSignature({
      security: DATATRANS_SECURITY as any,
      signKey: DATATRANS_SIGN2_KEY! || DATATRANS_SIGN_KEY!,
    })(timestamp, req.body);

    if (hash !== comparableSignature) {
      logger.error(`hash mismatch: ${signature} / ${comparableSignature}`, req.body);
      res.status(403).send('Hash mismatch');
      return;
    }

    const transaction: StatusResponseSuccess = JSON.parse(req.body) as StatusResponseSuccess;

    logger.info(`received request`, {
      type: transaction.type,
    });

    if (transaction.status === 'authorized') {
      const userId = transaction.refno2;
      const referenceId = Buffer.from(transaction.refno, 'base64').toString('hex');

      try {
        if (transaction.type === 'card_check') {
          const paymentProviderId = referenceId;
          const paymentCredentials = await services.orders.registerPaymentCredentials(
            paymentProviderId,
            { userId, transactionContext: { transactionId: transaction.transactionId } },
          );
          logger.info(`registered payment credentials for ${userId}`, {
            userId,
          });
          res.status(200).send(paymentCredentials);
          return;
        }
        if (transaction.type === 'payment') {
          const orderPaymentId = referenceId;
          const orderPayment = await modules.orders.payments.findOrderPayment({
            orderPaymentId,
          });
          if (!orderPayment) throw new Error(`Order Payment with id ${orderPaymentId} not found`);

          const order = await services.orders.checkoutOrder(orderPayment.orderId, {
            paymentContext: { userId, transactionId: transaction.transactionId },
          });

          if (!order) throw new Error(`Order with id ${orderPayment.orderId} not found`);

          logger.info(`confirmed checkout for order ${order.orderNumber}`, {
            orderId: order._id,
          });
          res.status(200).send(order);
          return;
        }
      } catch (e) {
        logger.error(`rejected to checkout with message`, e);
        res.status(500).send({ name: e.name, code: e.code, message: e.message });
        return;
      }
    }
  }
  res.status(404).end();
};
