import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/api';
import generateSignature, { Security } from './generateSignature.js';
import { StatusResponseSuccess } from './api/types.js';

const {
  DATATRANS_SIGN_KEY,
  DATATRANS_SIGN2_KEY,
  DATATRANS_SECURITY = Security.DYNAMIC_SIGN,
} = process.env;

const logger = createLogger('unchained:core-payment:datatrans:webhook');

export const datatransHandler = async (req, res) => {
  const resolvedContext = req.unchainedContext as Context;
  const { modules, services } = resolvedContext;
  const signature = req.headers['datatrans-signature'];
  if (req.method === 'POST' && signature) {
    const [rawTimestamp, rawHash] = signature.split(',');
    const [, hash] = rawHash.split('=');
    const [, timestamp] = rawTimestamp.split('=');

    console.log({
      security: DATATRANS_SECURITY as any,
      signKey: DATATRANS_SIGN2_KEY || DATATRANS_SIGN_KEY,
      timestamp,
      body: req.body,
    });
    const comparableSignature = await generateSignature({
      security: DATATRANS_SECURITY as any,
      signKey: DATATRANS_SIGN2_KEY || DATATRANS_SIGN_KEY,
    })(timestamp, req.body);

    logger.info('WTF');
    if (hash !== comparableSignature) {
      logger.error(`hash mismatch: ${signature} / ${comparableSignature}`, req.body);
      res.writeHead(403);
      res.end('Hash mismatch');
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
            resolvedContext,
          );
          logger.info(`registered payment credentials for ${userId}`, {
            userId,
          });
          res.writeHead(200);
          res.end(JSON.stringify(paymentCredentials));
          return;
        }
        if (transaction.type === 'payment') {
          const orderPaymentId = referenceId;
          const orderPayment = await modules.orders.payments.findOrderPayment({
            orderPaymentId,
          });
          if (!orderPayment) throw new Error(`Order Payment with id ${orderPaymentId} not found`);

          const order = await services.orders.checkoutOrder(
            orderPayment.orderId,
            { paymentContext: { userId, transactionId: transaction.transactionId } },
            resolvedContext,
          );
          res.writeHead(200);
          logger.info(`confirmed checkout for order ${order.orderNumber}`, {
            orderId: order._id,
          });
          res.end(JSON.stringify(order));
          return;
        }
      } catch (e) {
        logger.error(`rejected to checkout with message`, e);
        res.writeHead(500);
        res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
        return;
      }
    }
  }
  res.writeHead(404);
  res.end();
};
