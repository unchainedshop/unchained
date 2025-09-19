import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/api';
import generateSignature, { Security } from './generateSignature.js';
import { StatusResponseSuccess } from './api/types.js';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';

const {
  DATATRANS_SIGN_KEY,
  DATATRANS_SIGN2_KEY,
  DATATRANS_SECURITY = Security.DYNAMIC_SIGN,
} = process.env;

const logger = createLogger('unchained:core-payment:datatrans:handler');

export const datatransHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: Context;
  },
  reply,
) => {
  const resolvedContext = req.unchainedContext as Context;
  const { modules, services } = resolvedContext;
  const signature = req.headers['datatrans-signature'] as string;
  if (signature) {
    const [rawTimestamp, rawHash] = signature.split(',');
    const [, hash] = rawHash.split('=');
    const [, timestamp] = rawTimestamp.split('=');

    const comparableSignature = await generateSignature({
      security: DATATRANS_SECURITY as any,
      signKey: DATATRANS_SIGN2_KEY || DATATRANS_SIGN_KEY,
    })(timestamp, req.body as string);

    if (hash !== comparableSignature) {
      logger.error(`hash mismatch: ${signature} / ${comparableSignature}`);
      reply.status(403);
      return reply.send({ success: false, message: 'Invalid Signature', name: 'HASH_MISMATCH' });
    }

    const transaction: StatusResponseSuccess = JSON.parse(req.body as string) as StatusResponseSuccess;

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
          reply.status(200);
          return reply.send(paymentCredentials);
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
          reply.status(200);
          logger.info(`confirmed checkout for order ${order.orderNumber}`, {
            orderId: order._id,
          });
          return reply.send(order);
        }
      } catch (e) {
        logger.error(e);
        reply.status(500);
        return reply.send({ success: false, name: e.name, code: e.code, message: e.message });
      }
    }
  }
  reply.status(404);
  return reply.send();
};
