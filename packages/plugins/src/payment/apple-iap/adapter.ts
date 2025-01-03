import { IPaymentAdapter, PaymentAdapter, PaymentDirector, PaymentError } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import { AppleTransactionsModule } from './module.js';
import { verifyReceipt } from './verify-receipt.js';

const logger = createLogger('unchained:core-payment:iap');

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
          logger.debug('Apple IAP Plugin: Receipt validated and updated for the user');
          const latestTransaction = latestReceiptInfo[latestReceiptInfo.length - 1]; // eslint-disable-line
          return {
            token: latestTransaction.web_order_line_item_id, // eslint-disable-line
            latestReceiptInfo,
          };
        }

        logger.warn('Apple IAP Plugin: Receipt invalid', {
          status: response.status,
        });
        return null;
      },

      // eslint-disable-next-line
      async charge(transactionContext) {
        const { meta, paymentCredentials, receiptData } = transactionContext || {};
        const { transactionIdentifier } = meta || {};

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
          await modules.appleTransactions.findTransactionById(transactionIdentifier);

        if (alreadyProcessedTransaction)
          throw new Error('Apple IAP Plugin: Transaction already processed');

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
