import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { OrderPayments } from 'meteor/unchained:core-orders';
import bodyParser from 'body-parser';
import { createLogger } from 'meteor/unchained:core-logger';
import { PaymentCredentials } from 'meteor/unchained:core-payment';
import getPaths from './getPaths';
import generateSignature, { Security } from './generateSignature';

import type { StatusResponseSuccess } from './api/types';

const {
  DATATRANS_SIGN_KEY,
  DATATRANS_SIGN2_KEY,
  DATATRANS_SECURITY = Security.DYNAMIC_SIGN,
} = process.env;

const logger = createLogger('unchained:core-payment:datatrans2');

const { postUrl, cancelUrl, errorUrl, successUrl, returnUrl } = getPaths(true);

useMiddlewareWithCurrentContext(
  postUrl,
  bodyParser.urlencoded({ extended: false })
);

useMiddlewareWithCurrentContext(
  cancelUrl,
  bodyParser.urlencoded({ extended: false })
);

useMiddlewareWithCurrentContext(
  errorUrl,
  bodyParser.urlencoded({ extended: false })
);

useMiddlewareWithCurrentContext(
  successUrl,
  bodyParser.urlencoded({ extended: false })
);

useMiddlewareWithCurrentContext(
  returnUrl,
  bodyParser.urlencoded({ extended: false })
);

console.log(postUrl);

useMiddlewareWithCurrentContext(postUrl, async (req, res) => {
  console.log(req);
  if (req.method === 'POST') {
    const transaction: StatusResponseSuccess = req.body || {};

    if (transaction.status === 'authorized') {
      const userId = transaction.refno2;

      try {
        if (transaction.type === 'card_check') {
          const paymentCredentials =
            PaymentCredentials.registerPaymentCredentials({
              paymentProviderId: transaction.refno,
              paymentContext: { transactionId: transaction.transactionId },
              userId,
            });
          logger.info(
            `Datatrans Webhook: Unchained registered payment credentials for ${userId}`,
            { userId }
          );
          res.writeHead(200);
          res.end(JSON.stringify(paymentCredentials));
          return;
        }
        if (transaction.type === 'payment') {
          const orderPayment = OrderPayments.findOne({
            _id: transaction.refno,
          });
          const order = await orderPayment.order().checkout({
            paymentContext: { transactionId: transaction.transactionId },
          });
          res.writeHead(200);
          logger.info(
            `Datatrans Webhook: Unchained confirmed checkout for order ${order.orderNumber}`,
            { orderId: order._id }
          );
          res.end(JSON.stringify(order));
          return;
        }
      } catch (e) {
        logger.error(
          `Datatrans Webhook: Unchained rejected to checkout with message ${JSON.stringify(
            e
          )}`
        );
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
      `Secure Fields Payment authenticated\nTransaction ID: ${datatransTrxId}\nNeeds authorization`
    );
  }
  res.writeHead(404);
  res.end();
});
