import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
  PaymentCredentials,
} from 'meteor/unchained:core-payment';
import { OrderPayments } from 'meteor/unchained:core-orders';
import {
  SubscriptionStatus,
  Subscriptions,
} from 'meteor/unchained:core-subscriptions';
import bodyParser from 'body-parser';
import fetch from 'isomorphic-unfetch';
import { Mongo } from 'meteor/mongo';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import logger from '../logger';

const AppleTransactions = new Mongo.Collection(
  'payment_apple_iap_processed_transactions'
);

const {
  APPLE_IAP_SHARED_SECRET,
  APPLE_IAP_ENVIRONMENT = 'sandbox',
  APPLE_IAP_WEBHOOK_PATH = '/graphql/apple-iap',
} = process.env;

// https://developer.apple.com/documentation/storekit/in-app_purchase/validating_receipts_with_the_app_store
const environments = {
  sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
  production: 'https://buy.itunes.apple.com/verifyReceipt',
};

const verifyReceipt = async ({ receiptData, password }) => {
  const payload = {
    'receipt-data': receiptData,
  };
  if (password) {
    payload.password = password;
  }
  const result = await fetch(environments[APPLE_IAP_ENVIRONMENT], {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
  });
  return result.json();
};

const AppleNotificationTypes = {
  INITIAL_BUY: 'INITIAL_BUY',
  DID_RECOVER: 'DID_RECOVER',
  DID_CHANGE_RENEWAL_STATUS: 'DID_CHANGE_RENEWAL_STATUS',
  DID_FAIL_TO_RENEW: 'DID_FAIL_TO_RENEW',
  DID_CHANGE_RENEWAL_PREF: 'DID_CHANGE_RENEWAL_PREF',
};

const fixPeriods = ({
  transactionId,
  subscriptionId,
  orderId,
  transactions,
}) => {
  const relevantTransactions = transactions.filter(
    // eslint-disable-next-line
    ({ original_transaction_id }) => {
      return original_transaction_id === transactionId; // eslint-disable-line
    }
  );

  const adjustedSubscriptionPeriods = relevantTransactions
    .map((transaction) => {
      return {
        isTrial: transaction.is_trial_period === 'true', // eslint-disable-line
        start: new Date(parseInt(transaction.purchase_date_ms, 10)),
        end: new Date(parseInt(transaction.expires_date_ms, 10)),
        orderId: transaction.transaction_id === transactionId ? orderId : null,
      };
    })
    .sort((left, right) => {
      return left.end.getTime() - right.end.getTime();
    });

  Subscriptions.update(
    {
      _id: subscriptionId,
    },
    {
      $pull: {
        periods: { orderId: { $in: [orderId, undefined, null] } },
      },
    }
  );

  Subscriptions.update(
    {
      _id: subscriptionId,
    },
    {
      $set: {
        updated: new Date(),
      },
      $push: {
        periods: { $each: adjustedSubscriptionPeriods },
      },
    }
  );
};

useMiddlewareWithCurrentContext(
  APPLE_IAP_WEBHOOK_PATH,
  bodyParser.json({
    strict: false,
  })
);

useMiddlewareWithCurrentContext(APPLE_IAP_WEBHOOK_PATH, async (req, res) => {
  if (req.method === 'POST') {
    try {
      const responseBody = req.body || {};
      if (responseBody.password !== APPLE_IAP_SHARED_SECRET) {
        throw new Error('shared secret not valid');
      }

      const transactions = responseBody?.unified_receipt?.latest_receipt_info; // eslint-disable-line
      const latestTransaction = transactions[0];

      if (
        responseBody.notification_type === AppleNotificationTypes.INITIAL_BUY
      ) {
        // Find the cart to checkout
        const orderPayment = OrderPayments.findOne({
          'context.meta.transactionIdentifier':
            latestTransaction.transaction_id,
        });

        if (!orderPayment)
          throw new Error('Could not find any matching order payment');
        const order = orderPayment.order();

        if (order.isCart()) {
          // checkout if is cart, else just ignore because the cart is already checked out
          // through submission of the receipt with GraphQL
          const checkedOut = await order.checkout({
            paymentContext: {
              receiptData: responseBody?.unified_receipt?.latest_receipt, // eslint-disable-line
            },
          });
          fixPeriods({
            transactionId: latestTransaction.original_transaction_id,
            transactions,
            subscriptionId: checkedOut.subscription()?._id,
            orderId: checkedOut._id,
          });
          logger.info(
            `Apple IAP Webhook: Confirmed checkout for order ${checkedOut.orderNumber}`,
            { orderId: checkedOut._id }
          );
        }
      } else {
        // Just store payment credentials, use the subscriptions paymentProvider reference and
        // let the job do the rest
        const originalOrderPayment = OrderPayments.findOne({
          'context.meta.transactionIdentifier':
            latestTransaction.original_transaction_id,
        });
        if (!originalOrderPayment)
          throw new Error('Could not find any matching order payment');
        const originalOrder = originalOrderPayment.order();
        const subscription = originalOrder.subscription();

        PaymentCredentials.registerPaymentCredentials({
          paymentProviderId: subscription.payment.paymentProviderId,
          paymentContext: {
            receiptData: responseBody?.unified_receipt?.latest_receipt, // eslint-disable-line
          },
          userId: subscription.userId,
        });

        fixPeriods({
          transactionId: latestTransaction.original_transaction_id,
          transactions,
          subscriptionId: subscription._id,
          orderId: originalOrder._id,
        });

        logger.info(
          `Apple IAP Webhook: Processed notification for ${latestTransaction.original_transaction_id} and type ${responseBody.notification_type}`
        );

        if (
          responseBody.notification_type === AppleNotificationTypes.DID_RECOVER
        ) {
          if (
            subscription.status !== SubscriptionStatus.TERMINATED &&
            responseBody.auto_renew_status === 'false'
          ) {
            await subscription.terminate();
          }
        }

        if (
          responseBody.notification_type ===
          AppleNotificationTypes.DID_CHANGE_RENEWAL_STATUS
        ) {
          if (
            subscription.status !== SubscriptionStatus.TERMINATED &&
            responseBody.auto_renew_status === 'false'
          ) {
            await subscription.terminate();
          }
        }
        logger.info(`Apple IAP Webhook: Updated subscription from Apple`);
      }

      res.writeHead(200);
      return res.end();
    } catch (e) {
      logger.warn(`Apple IAP Webhook: ${e.message}`, e);
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

  static initialConfiguration = [];

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

  // eslint-disable-next-line
  async register(transactionResponse) {
    const { receiptData } = transactionResponse;
    const response = await verifyReceipt({
      receiptData,
      password: APPLE_IAP_SHARED_SECRET,
    });
    const { status, latest_receipt_info } = response; // eslint-disable-line
    if (status === 0) {
      logger.info(
        'Apple IAP Plugin: Receipt validated and updated for the user',
        {
          level: 'verbose',
        }
      );
      const latestTransaction =
        latest_receipt_info[latest_receipt_info.length - 1];
      return {
        token: latestTransaction.web_order_line_item_id,
        latestReceiptInfo: latest_receipt_info,
      };
    }
    logger.warn('Apple IAP Plugin: Receipt invalid', {
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
        'Apple IAP Plugin: You have to set the transaction id on the order payment'
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
      throw new Error('Apple IAP Plugin: Receipt invalid');
    }

    const transactions =
      receiptResponse?.latest_receipt_info || // eslint-disable-line
      paymentCredentials?.meta?.latestReceiptInfo;
    const matchedTransaction = transactions.find(
      (transaction) => transaction?.transaction_id === transactionIdentifier // eslint-disable-line
    );
    if (!matchedTransaction) {
      throw new Error(
        `Apple IAP Plugin: Cannot match transaction with identifier ${transactionIdentifier}`
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
        'Apple IAP Plugin: You can only checkout 1 unique product at once'
      );
    }

    const [[productId, quantity]] = items;

    const orderMatchesTransaction =
      parseInt(matchedTransaction.quantity, 10) === quantity &&
      matchedTransaction.product_id === productId;

    if (!orderMatchesTransaction)
      throw new Error(
        'Apple IAP Plugin: Product in order does not match transaction'
      );

    const transactionAlreadyProcessed =
      AppleTransactions.find({
        transactionIdentifier,
      }).count() > 0;

    if (transactionAlreadyProcessed)
      throw new Error('Apple IAP Plugin: Transaction already processed');

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
