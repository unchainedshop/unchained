import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';
import { createLogger } from 'meteor/unchained:core-logger';
import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';
import fetch from 'isomorphic-unfetch';
import { Mongo } from 'meteor/mongo';

const logger = createLogger('unchained:core-payment:apple-iap');

const AppleTransactions = new Mongo.Collection(
  'payment_apple_iap_processed_transactions'
);

const {
  APPLE_IAP_SHARED_SECRET,
  APPLE_IAP_WEBHOOK_PATH = '/graphql/apple-iap',
} = process.env;

WebApp.connectHandlers.use(
  APPLE_IAP_WEBHOOK_PATH,
  bodyParser.json({
    strict: false,
  })
);

const environments = {
  sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
};

const verifyReceipt = async ({
  receiptData,
  password,
  environment = 'sandbox',
}) => {
  const payload = {
    'receipt-data': receiptData,
  };
  if (password) {
    payload['exclude-old-transactions'] = true;
    payload.password = password;
  }
  const result = await fetch(environments[environment], {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
  });
  return result.json();
};

WebApp.connectHandlers.use(APPLE_IAP_WEBHOOK_PATH, (req, res) => {
  if (req.method === 'POST') {
    try {
      const responseBody = req.body || {};
      if (responseBody.password !== APPLE_IAP_SHARED_SECRET) {
        throw new Error('shared secret not valid');
      }

      console.log(
        'APPLE TEST',
        responseBody,
        JSON.stringify(responseBody.unified_receipt.latest_receipt_info)
      );
      // if (amount === '0') {
      //   const [paymentProviderId, userId] = refno.split(':');
      //   const paymentCredentials = PaymentCredentials.registerPaymentCredentials(
      //     {
      //       paymentProviderId,
      //       paymentContext: authorizationResponse,
      //       userId,
      //     }
      //   );
      //   log(
      //     `AppleIAP Webhook: Unchained registered payment credentials for ${userId}`,
      //     { userId }
      //   );
      //   res.writeHead(200);
      //   return res.end(JSON.stringify(paymentCredentials));
      // }
      // const orderPayment = OrderPayments.findOne({ _id: refno });
      // const order = orderPayment
      //   .order()
      //   .checkout({ paymentContext: authorizationResponse });
      // res.writeHead(200);
      // log(
      //   `AppleIAP Webhook: Unchained confirmed checkout for order ${order.orderNumber}`,
      //   { orderId: order._id }
      // );
      // return res.end(JSON.stringify(order));
      res.writeHead(200);
      return res.end();
    } catch (e) {
      logger.error(e.message);
      res.writeHead(503);
      return res.end(JSON.stringify(e));
    }
  }
  res.writeHead(404);
  return res.end();
});

class AppleIAP extends PaymentAdapter {
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

  configurationError() {
    if (!APPLE_IAP_SHARED_SECRET) {
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
  async validate(token) {
    // once registered receipt transactions are valid by default!
    return true;
  }

  async register(transactionResponse) {
    const { receiptData } = transactionResponse;
    const response = await verifyReceipt({
      receiptData,
      password: APPLE_IAP_SHARED_SECRET,
    });
    const { status, latest_receipt_info } = response; // eslint-disable-line
    if (status === 0) {
      this.log('Receipt validated and updated for the user', {
        level: 'verbose',
      });
      const [latestTransaction] = latest_receipt_info; // eslint-disable-line
      return {
        token: latestTransaction.web_order_line_item_id,
        transaction: latestTransaction,
      };
    }
    this.log('Apple IAP -> Receipt invalid', {
      level: 'warn',
      status: response.status,
    });
    return null;
  }

  // eslint-disable-next-line
  async charge(result) {
    const { transactionIdentifier } = result?.meta;
    const { order } = this.context;

    if (!transactionIdentifier) {
      throw new Error(
        'Apple IAP -> You have to set the transaction id on the order payment'
      );
    }

    const { paymentCredentials, receiptData } = result;
    const receiptResponse =
      receiptData &&
      (await verifyReceipt({
        receiptData,
        password: APPLE_IAP_SHARED_SECRET,
      }));

    if (receiptResponse && receiptResponse.status !== 0) {
      throw new Error('Apple IAP -> Receipt invalid');
    }

    const transactions = receiptResponse?.latest_receipt_info || [
      // eslint-disable-line
      paymentCredentials?.meta?.transaction,
    ];
    const matchedTransaction = transactions.find(
      (transaction) => transaction?.transaction_id === transactionIdentifier // eslint-disable-line
    );
    if (!matchedTransaction) {
      throw new Error(
        `Apple IAP -> Cannot match transaction with identifier ${transactionIdentifier}`
      );
    }

    const items = Object.entries(
      order.items().reduce((acc, item) => {
        return {
          ...acc,
          [item.productId]: (acc[item.productId] || 0) + item.quantity,
        };
      }, {})
    );

    if (items.length !== 1) {
      throw new Error(
        'Apple IAP -> You can only checkout 1 unique product at once'
      );
    }

    const [[productId, quantity]] = items;

    const orderMatchesTransaction =
      parseInt(matchedTransaction.quantity, 10) === quantity &&
      matchedTransaction.product_id === productId;

    if (!orderMatchesTransaction)
      throw new Error(
        'Apple IAP -> Product in order does not match transaction'
      );

    const transactionAlreadyProcessed =
      AppleTransactions.find({
        transactionIdentifier,
      }).count() > 0;

    if (transactionAlreadyProcessed)
      throw new Error('Apple IAP -> Transaction already processed');

    // All good
    const transactionId = AppleTransactions.insert({
      transactionIdentifier,
      matchedTransaction,
      orderId: order._id,
    });
    return {
      transactionId,
    };
  }
}

PaymentDirector.registerAdapter(AppleIAP);
