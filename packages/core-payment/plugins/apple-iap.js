import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';
import { createLogger } from 'meteor/unchained:core-logger';
import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';
import fetch from 'isomorphic-unfetch';

const logger = createLogger('unchained:core-payment:apple-iap');

const {
  APPLE_IAP_SHARED_SECRET,
  APPLE_IAP_WEBHOOK_PATH = '/graphql/datatrans',
} = process.env;

WebApp.connectHandlers.use(
  APPLE_IAP_WEBHOOK_PATH,
  bodyParser.urlencoded({ extended: false })
);

const environments = {
  sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
};

const verifyReceipt = async ({
  receiptData,
  password,
  environment = 'sandbox',
}) => {
  const result = await fetch(environments[environment], {
    body: JSON.stringify({
      'receipt-data': receiptData,
      password,
      'exclude-old-transactions': true,
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
  });
  return result.json();
};

// WebApp.connectHandlers.use(APPLE_IAP_WEBHOOK_PATH, (req, res) => {
//   if (req.method === 'POST') {
//     const authorizationResponse = req.body || {};
//     const { refno, amount } = authorizationResponse;
//     if (refno) {
//       try {
//         if (amount === '0') {
//           const [paymentProviderId, userId] = refno.split(':');
//           const paymentCredentials = PaymentCredentials.registerPaymentCredentials(
//             {
//               paymentProviderId,
//               paymentContext: authorizationResponse,
//               userId,
//             }
//           );
//           log(
//             `Datatrans Webhook: Unchained registered payment credentials for ${userId}`,
//             { userId }
//           );
//           res.writeHead(200);
//           return res.end(JSON.stringify(paymentCredentials));
//         }
//         const orderPayment = OrderPayments.findOne({ _id: refno });
//         const order = orderPayment
//           .order()
//           .checkout({ paymentContext: authorizationResponse });
//         res.writeHead(200);
//         log(
//           `Datatrans Webhook: Unchained confirmed checkout for order ${order.orderNumber}`,
//           { orderId: order._id }
//         );
//         return res.end(JSON.stringify(order));
//       } catch (e) {
//         if (
//           e.message === 'Payment declined' ||
//           e.message === 'Signature mismatch'
//         ) {
//           // We also confirm a declined payment or a signature mismatch with 200 so
//           // datatrans does not retry to send us the failed transaction
//           log(
//             `Datatrans Webhook: Unchained declined checkout with message ${e.message}`,
//             { level: 'warn' }
//           );
//           res.writeHead(200);
//           return res.end();
//         }
//         res.writeHead(503);
//         return res.end(JSON.stringify(e));
//       }
//     } else {
//       log(`Datatrans Webhook: Reference number not set`, { level: 'warn' });
//     }
//   }
//   res.writeHead(404);
//   return res.end();
// });

class Datatrans extends PaymentAdapter {
  static key = 'shop.unchained.apple-iap';

  static label = 'Apple In-App-Purchase';

  static version = '1.0';

  static initialConfiguration = [
    {
      key: 'merchantId',
      value: null,
    },
  ];

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  getMerchantId() {
    return this.config.reduce((current, item) => {
      if (item.key === 'merchantId') return item.value;
      return current;
    }, null);
  }

  configurationError() {
    if (!this.getMerchantId() || !APPLE_IAP_SHARED_SECRET) {
      return PaymentError.INCOMPLETE_CONFIGURATION;
    }
    if (this.wrongCredentials) {
      return PaymentError.WRONG_CREDENTIALS;
    }
    return null;
  }

  isActive() {
    if (this.configurationError() === null) return true;
    return false;
  }

  // eslint-disable-next-line
  isPayLaterAllowed() {
    return false;
  }

  // eslint-disable-next-line
  async sign({ transactionContext = {} } = {}) {
    throw new Error('Apple IAP does not support payment signing');
  }

  // eslint-disable-next-line
  async charge({ receiptData }) {
    const response = await verifyReceipt({
      receiptData,
      password: APPLE_IAP_SHARED_SECRET,
    });
    const { status, latest_receipt_info, pending_renewal_info } = response;
    if (status === 0) {
      // now check if order products are all part of the receipt
      console.log({ latest_receipt_info, pending_renewal_info });
      return response;
    }
    throw new Error('Receipt invalid');
  }
}

PaymentDirector.registerAdapter(Datatrans);
