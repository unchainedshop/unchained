import {
  type IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
} from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import { type AppleTransactionsModule } from './module.ts';
import { verifyReceipt } from './verify-receipt.ts';

const logger = createLogger('unchained:apple-iap');

const { APPLE_IAP_SHARED_SECRET } = process.env;

const AppleIAP: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.apple-iap',
  label: 'Apple In-App-Purchase',
  version: '1.0.0',
  initialConfiguration: [],

  typeSupported: (type) => {
    return type === 'GENERIC';
  },

  actions: (params, context) => {
    const { order, modules } = context as typeof context & { modules: AppleTransactionsModule };

    const adapterActions = {
      ...PaymentAdapter.actions(params, context),

      configurationError() {
        if (!APPLE_IAP_SHARED_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive() {
        if (adapterActions.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      async sign() {
        throw new Error('Payment signing not supported');
      },

      async validate() {
        // once registered receipt transactions are valid by default!
        return true;
      },

      async register(transactionContext) {
        const { receiptData } = transactionContext;

        const response = await verifyReceipt({
          receiptData,
          password: APPLE_IAP_SHARED_SECRET,
        });
        const { status, latest_receipt_info: latestReceiptInfo } = response;

        if (status === 0) {
          logger.debug('Receipt validated and updated for the user');
          const latestTransaction = latestReceiptInfo[latestReceiptInfo.length - 1];
          return {
            token: latestTransaction.web_order_line_item_id,
            latestReceiptInfo,
          };
        }

        logger.warn('Receipt invalid', {
          status: response.status,
        });
        return null;
      },

      async charge(transactionContext) {
        const { meta, paymentCredentials, receiptData } = transactionContext || {};
        const { transactionIdentifier } = meta || {};

        if (!transactionIdentifier) {
          throw new Error('You have to set the transaction id on the order payment');
        }

        if (!order) throw new Error('Order not found');

        const receiptResponse =
          receiptData &&
          (await verifyReceipt({
            receiptData,
            password: APPLE_IAP_SHARED_SECRET,
          }));

        if (receiptResponse && receiptResponse.status !== 0) {
          throw new Error('Receipt invalid');
        }

        const transactions =
          receiptResponse?.latest_receipt_info || paymentCredentials?.meta?.latestReceiptInfo;
        const matchedTransaction = transactions?.find(
          (transaction) => transaction?.transaction_id === transactionIdentifier,
        );
        if (!matchedTransaction) {
          throw new Error(`Cannot match transaction with identifier ${transactionIdentifier}`);
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
          throw new Error('You can only checkout 1 unique product at once');
        }

        const [[productId, quantity]] = items;

        const isMatchesTransaction =
          parseInt(matchedTransaction.quantity, 10) === quantity &&
          matchedTransaction.product_id === productId;

        if (!isMatchesTransaction) throw new Error('Product in order does not match transaction');

        const alreadyProcessedTransaction =
          await modules.appleTransactions.findTransactionById(transactionIdentifier);

        if (alreadyProcessedTransaction) throw new Error('Transaction already processed');

        // All good
        await modules.appleTransactions.createTransaction({
          _id: transactionIdentifier,
          matchedTransaction,
          orderId: order._id,
        });

        return {
          transactionIdentifier,
        };
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(AppleIAP);
