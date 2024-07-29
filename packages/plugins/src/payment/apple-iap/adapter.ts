/// <reference lib="dom" />
import { Context } from '@unchainedshop/api';
import { IPaymentAdapter } from '@unchainedshop/core-payment';
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { PaymentAdapter, PaymentDirector, PaymentError } from '@unchainedshop/core-payment';
import { createLogger } from '@unchainedshop/logger';
import { UnchainedCore } from '@unchainedshop/core';
import { AppleTransactionsModule } from './module/configureAppleTransactionsModule.js';

const logger = createLogger('unchained:core-payment:iap');

const { APPLE_IAP_SHARED_SECRET, APPLE_IAP_ENVIRONMENT = 'sandbox' } = process.env;

// https://developer.apple.com/documentation/storekit/in-app_purchase/validating_receipts_with_the_app_store
const environments = {
  sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
  production: 'https://buy.itunes.apple.com/verifyReceipt',
};

const verifyReceipt = async ({ receiptData, password }): Promise<any> => {
  const payload: any = {
    'receipt-data': receiptData,
  };
  if (password) {
    payload.password = password;
  }
  const result = await fetch(environments[APPLE_IAP_ENVIRONMENT], {
    body: JSON.stringify(payload),
    method: 'POST',
    // eslint-disable-next-line
    // @ts-ignore
    duplex: 'half',
    headers: {
      'Content-Type': 'application/json',
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

const fixPeriods = async (
  { transactionId, enrollmentId, orderId, transactions },
  unchainedAPI: UnchainedCore,
) => {
  const relevantTransactions = transactions.filter(
    // eslint-disable-next-line
    ({ original_transaction_id }) => {
      return original_transaction_id === transactionId; // eslint-disable-line
    },
  );

  const adjustedEnrollmentPeriods = relevantTransactions
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

  await unchainedAPI.modules.enrollments.removeEnrollmentPeriodByOrderId(enrollmentId, orderId);

  return Promise.all(
    adjustedEnrollmentPeriods.map((period) =>
      unchainedAPI.modules.enrollments.addEnrollmentPeriod(enrollmentId, period),
    ),
  );
};

export const appleIAPHandler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const resolvedContext = req.unchainedContext as Context;
      const { modules } = resolvedContext;
      const responseBody = req.body || {};
      if (responseBody.password !== APPLE_IAP_SHARED_SECRET) {
        throw new Error('shared secret not valid');
      }

      const transactions = responseBody?.unified_receipt?.latest_receipt_info; // eslint-disable-line
      const latestTransaction = transactions[0];

      if (responseBody.notification_type === AppleNotificationTypes.INITIAL_BUY) {
        // Find the cart to checkout
        const orderPayment = await modules.orders.payments.findOrderPaymentByContextData({
          context: {
            'meta.transactionIdentifier': latestTransaction.transaction_id,
          },
        });

        if (!orderPayment) throw new Error('Could not find any matching order payment');

        const order = await modules.orders.checkout(
          orderPayment.orderId,
          {
            paymentContext: {
                receiptData: responseBody?.unified_receipt?.latest_receipt, // eslint-disable-line
            },
          },
          resolvedContext,
        );
        const orderId = order._id;
        const enrollment = await modules.enrollments.findEnrollment({
          orderId,
        });
        await fixPeriods(
          {
            transactionId: latestTransaction.original_transaction_id,
            transactions,
            enrollmentId: enrollment._id,
            orderId,
          },
          resolvedContext,
        );

        logger.info(`Apple IAP Webhook: Confirmed checkout for order ${order.orderNumber}`, {
          orderId: order._id,
        });
      } else {
        // Just store payment credentials, use the enrollments paymentProvider reference and
        // let the job do the rest
        const originalOrderPayment = await modules.orders.payments.findOrderPaymentByContextData({
          context: {
            'meta.transactionIdentifier': latestTransaction.original_transaction_id,
          },
        });
        if (!originalOrderPayment) throw new Error('Could not find any matching order payment');
        const originalOrder = await modules.orders.findOrder({
          orderId: originalOrderPayment.orderId,
        });
        const enrollment = await modules.enrollments.findEnrollment({
          orderId: originalOrder._id,
        });

        await modules.payment.registerCredentials(
          enrollment.payment.paymentProviderId,
          {
            transactionContext: {
              receiptData: responseBody?.unified_receipt?.latest_receipt, // eslint-disable-line
            },
            userId: enrollment.userId,
          },
          resolvedContext,
        );

        await fixPeriods(
          {
            transactionId: latestTransaction.original_transaction_id,
            transactions,
            enrollmentId: enrollment._id,
            orderId: originalOrder._id,
          },
          resolvedContext,
        );

        logger.info(
          `Apple IAP Webhook: Processed notification for ${latestTransaction.original_transaction_id} and type ${responseBody.notification_type}`,
        );

        if (responseBody.notification_type === AppleNotificationTypes.DID_RECOVER) {
          if (
            enrollment.status !== EnrollmentStatus.TERMINATED &&
            responseBody.auto_renew_status === 'false'
          ) {
            await modules.enrollments.terminateEnrollment(enrollment, resolvedContext);
          }
        }

        if (responseBody.notification_type === AppleNotificationTypes.DID_CHANGE_RENEWAL_STATUS) {
          if (
            enrollment.status !== EnrollmentStatus.TERMINATED &&
            responseBody.auto_renew_status === 'false'
          ) {
            await modules.enrollments.terminateEnrollment(enrollment, resolvedContext);
          }
        }
        logger.info(`Apple IAP Webhook: Updated enrollment from Apple`);
      }

      res.writeHead(200);
      res.end();
      return;
    } catch (e) {
      logger.warn(`Apple IAP Webhook: ${e.message}`, e);
      res.writeHead(503);
      res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
      return;
    }
  }
  res.writeHead(404);
  res.end();
};

const AppleIAP: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.apple-iap',
  label: 'Apple In-App-Purchase',
  version: '1.0.0',
  initialConfiguration: [],

  typeSupported: (type) => {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const { modules } = params.context;

    const adapterActions = {
      ...PaymentAdapter.actions(params),

      configurationError() {
        // eslint-disable-line
        if (!APPLE_IAP_SHARED_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive() {
        if (adapterActions.configurationError() === null) return true;
        return false;
      },

      // eslint-disable-next-line
      isPayLaterAllowed() {
        return false;
      },

      // eslint-disable-next-line
      async sign() {
        throw new Error('Apple IAP does not support payment signing');
      },

      // eslint-disable-next-line
      async validate() {
        // once registered receipt transactions are valid by default!
        return true;
      },

      // eslint-disable-next-line
      async register(transactionContext) {
        const { receiptData } = transactionContext;

        const response = await verifyReceipt({
          receiptData,
          password: APPLE_IAP_SHARED_SECRET,
        });
        const { status, latest_receipt_info: latestReceiptInfo } = response; // eslint-disable-line

        if (status === 0) {
          logger.info('Apple IAP Plugin: Receipt validated and updated for the user', {
            level: 'verbose',
          });
          const latestTransaction = latestReceiptInfo[latestReceiptInfo.length - 1]; // eslint-disable-line
          return {
            token: latestTransaction.web_order_line_item_id, // eslint-disable-line
            latestReceiptInfo,
          };
        }

        logger.warn('Apple IAP Plugin: Receipt invalid', {
          level: 'warn',
          status: response.status,
        });
        return null;
      },

      // eslint-disable-next-line
      async charge(transactionContext) {
        const { order } = params.paymentContext;
        const { meta, paymentCredentials, receiptData } = transactionContext || {};
        const { transactionIdentifier } = meta || {};
        const appleTransactions = (params.context.modules as any)
          .appleTransactions as AppleTransactionsModule;

        if (!transactionIdentifier) {
          throw new Error('Apple IAP Plugin: You have to set the transaction id on the order payment');
        }

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
        const matchedTransaction = transactions?.find(
          (transaction) => transaction?.transaction_id === transactionIdentifier, // eslint-disable-line
        );
        if (!matchedTransaction) {
          throw new Error(
            `Apple IAP Plugin: Cannot match transaction with identifier ${transactionIdentifier}`,
          );
        }

        const orderPositions = await modules.orders.positions.findOrderPositions({
          orderId: order._id,
        });
        const items = Object.entries(
          orderPositions.reduce((acc, item) => {
            return {
              ...acc,
              [item.productId]: (acc[item.productId] || 0) + item.quantity,
            };
          }, {}),
        );

        if (items.length !== 1) {
          throw new Error('Apple IAP Plugin: You can only checkout 1 unique product at once');
        }

        const [[productId, quantity]] = items;

        const isMatchesTransaction =
          parseInt(matchedTransaction.quantity, 10) === quantity &&
          matchedTransaction.product_id === productId; // eslint-disable-line

        if (!isMatchesTransaction)
          throw new Error('Apple IAP Plugin: Product in order does not match transaction');

        const alreadyProcessedTransaction =
          await appleTransactions.findTransactionById(transactionIdentifier);

        if (alreadyProcessedTransaction)
          throw new Error('Apple IAP Plugin: Transaction already processed');

        // All good
        const userId = order?.userId || params.paymentContext?.userId;
        await appleTransactions.createTransaction(
          {
            _id: transactionIdentifier,
            matchedTransaction,
            orderId: order._id,
          },
          userId,
        );

        return {
          transactionIdentifier,
        };
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(AppleIAP);
