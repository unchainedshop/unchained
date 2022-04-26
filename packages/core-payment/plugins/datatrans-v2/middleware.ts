import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import bodyParser from 'body-parser';
import { createLogger } from 'meteor/unchained:logger';
import { Context } from '@unchainedshop/types/api';
import getPaths from './getPaths';
import generateSignature, { Security } from './generateSignature';

import type { StatusResponseSuccess } from './api/types';

const {
  DATATRANS_SIGN_KEY,
  DATATRANS_SIGN2_KEY,
  DATATRANS_SECURITY = Security.DYNAMIC_SIGN,
} = process.env;

const logger = createLogger('unchained:core-payment:datatrans');

const { postUrl, cancelUrl, errorUrl, successUrl, returnUrl } = getPaths(true);

useMiddlewareWithCurrentContext(
  postUrl,
  bodyParser.text({
    type: 'application/json',
  }),
);

useMiddlewareWithCurrentContext(cancelUrl, bodyParser.urlencoded({ extended: false }));

useMiddlewareWithCurrentContext(errorUrl, bodyParser.urlencoded({ extended: false }));

useMiddlewareWithCurrentContext(successUrl, bodyParser.urlencoded({ extended: false }));

useMiddlewareWithCurrentContext(returnUrl, bodyParser.urlencoded({ extended: false }));

useMiddlewareWithCurrentContext(postUrl, async (req, res) => {
  const resolvedContext = req.unchainedContext as Context;
  const { services, modules } = resolvedContext;
  const signature = req.headers['datatrans-signature'];
  if (req.method === 'POST' && signature) {
    const [rawTimestamp, rawHash] = signature.split(',');
    const [, hash] = rawHash.split('=');
    const [, timestamp] = rawTimestamp.split('=');

    const comparableSignature = generateSignature({
      security: DATATRANS_SECURITY,
      signKey: DATATRANS_SIGN2_KEY || DATATRANS_SIGN_KEY,
    })(timestamp, req.body);

    if (hash !== comparableSignature) {
      logger.error(`Datatrans Plugin: Hash mismatch: ${signature} / ${comparableSignature}`, req.body);
      res.writeHead(403);
      res.end('Hash mismatch');
      return;
    }

    const transaction: StatusResponseSuccess = JSON.parse(req.body) as StatusResponseSuccess;

    if (transaction.status === 'authorized') {
      const userId = transaction.refno2;
      const referenceId = Buffer.from(transaction.refno, 'base64').toString('hex');

      try {
        if (transaction.type === 'card_check') {
          const paymentProviderId = referenceId;
          const paymentCredentials = await services.payment.registerPaymentCredentials(
            paymentProviderId,
            { transactionContext: { transactionId: transaction.transactionId } },
            { ...resolvedContext, userId },
          );
          logger.info(`Datatrans Webhook: Unchained registered payment credentials for ${userId}`, {
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

          const order = await modules.orders.checkout(
            orderPayment.orderId,
            { paymentContext: { transactionId: transaction.transactionId } },
            resolvedContext,
          );
          res.writeHead(200);
          logger.info(`Datatrans Webhook: Unchained confirmed checkout for order ${order.orderNumber}`, {
            orderId: order._id,
          });
          res.end(JSON.stringify(order));
          return;
        }
      } catch (e) {
        logger.error(`Datatrans Webhook: Unchained rejected to checkout with message`, e);
        res.writeHead(500);
        res.end(JSON.stringify(e));
        return;
      }
    }
  }
  res.writeHead(404);
  res.end();
});

useMiddlewareWithCurrentContext(successUrl, async (req, res) => {
  if (req.method === 'GET') {
    const { datatransTrxId } = req.query;
    res.end(`Payment successful\nTransaction ID: ${datatransTrxId}`);
    return;
  }
  res.writeHead(404);
  res.end();
});

useMiddlewareWithCurrentContext(errorUrl, async (req, res) => {
  if (req.method === 'GET') {
    const { datatransTrxId } = req.query;
    res.end(`Payment error\nTransaction ID: ${datatransTrxId}`);
    return;
  }
  res.writeHead(404);
  res.end();
});

useMiddlewareWithCurrentContext(cancelUrl, async (req, res) => {
  if (req.method === 'GET') {
    const { datatransTrxId } = req.query;
    res.end(`Payment cancelled\nTransaction ID: ${datatransTrxId}`);
    return;
  }
  res.writeHead(404);
  res.end();
});

useMiddlewareWithCurrentContext(returnUrl, async (req, res) => {
  if (req.method === 'GET') {
    const { datatransTrxId } = req.query;
    res.end(
      `Secure Fields Payment authenticated\nTransaction ID: ${datatransTrxId}\nNeeds authorization`,
    );
  }
  res.writeHead(404);
  res.end();
});
