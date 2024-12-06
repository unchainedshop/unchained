import { createLogger } from '@unchainedshop/logger';
import {
  UnchainedCore,
  OrderPricingSheet,
  IPaymentActions,
  IPaymentAdapter,
  PaymentAdapter,
  PaymentChargeActionResult,
  PaymentDirector,
  PaymentError,
} from '@unchainedshop/core';
import * as pf from 'postfinancecheckout';

import {
  confirmDeferredTransaction,
  createTransaction,
  getIframeJavascriptUrl,
  getLightboxJavascriptUrl,
  getPaymentPageUrl,
  getToken,
  getTransaction,
  refundTransaction,
  voidTransaction,
} from './api.js';
import { orderIsPaid } from './utils.js';
import { CompletionModes, IntegrationModes, SignResponse } from './types.js';

export * from './middleware.js';

const { PostFinanceCheckout } = pf;

const {
  PFCHECKOUT_SPACE_ID,
  PFCHECKOUT_USER_ID,
  PFCHECKOUT_SECRET,
  PFCHECKOUT_SUCCESS_URL,
  PFCHECKOUT_FAILED_URL,
} = process.env;

const logger = createLogger('unchained:core-payment:postfinance');

const newError = ({ code, message }: { code: string; message: string }) => {
  const error = new Error(message);
  error.name = `POSTFINANCE_${code}`;
  return error;
};

const PostfinanceCheckout: IPaymentAdapter<UnchainedCore> = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.postfinance-checkout',
  label: 'Postfinance Checkout',
  version: '1.0.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (config, context) => {
    const adapter: IPaymentActions & {
      getCompletionMode: () => CompletionModes;
    } = {
      ...PaymentAdapter.actions(config, context),

      getCompletionMode() {
        return (
          (config.find((item) => item.key === 'completionMode')?.value as CompletionModes) ||
          CompletionModes.Deferred
        );
      },

      // eslint-disable-next-line
      configurationError() {
        // eslint-disable-line
        if (
          !PFCHECKOUT_SPACE_ID ||
          !PFCHECKOUT_USER_ID ||
          !PFCHECKOUT_SECRET ||
          !PFCHECKOUT_SUCCESS_URL ||
          !PFCHECKOUT_FAILED_URL
        ) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive() {
        if (adapter.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      async validate(credentials) {
        if (!credentials.meta) return false;
        const { linkedSpaceId } = credentials.meta;
        const tokenData = await getToken(linkedSpaceId, credentials.token);
        return tokenData.state === PostFinanceCheckout.model.CreationEntityState.ACTIVE;
      },

      sign: async (transactionContext: any = {}) => {
        const { orderPayment, order } = context;

        const { integrationMode = IntegrationModes.PaymentPage }: { integrationMode: IntegrationModes } =
          transactionContext;
        const completionMode = adapter.getCompletionMode();
        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currency: order.currency,
        });

        const totalAmount = pricing?.total({ useNetPrice: false }).amount;
        const transaction = new PostFinanceCheckout.model.TransactionCreate();
        const userId = order?.userId || context?.userId;
        transaction.currency = order.currency;
        transaction.metaData = {
          orderPaymentId: orderPayment._id,
        };
        transaction.successUrl = `${transactionContext?.successUrl || PFCHECKOUT_SUCCESS_URL}?order_id=${
          orderPayment.orderId
        }`;
        transaction.failedUrl = `${transactionContext?.failedUrl || PFCHECKOUT_FAILED_URL}?order_id=${
          orderPayment.orderId
        }`;
        transaction.customerId = userId;
        transaction.tokenizationMode =
          PostFinanceCheckout.model.TokenizationMode.ALLOW_ONE_CLICK_PAYMENT;
        if (completionMode === CompletionModes.Immediate) {
          transaction.completionBehavior =
            PostFinanceCheckout.model.TransactionCompletionBehavior.COMPLETE_IMMEDIATELY;
        } else if (completionMode === CompletionModes.Deferred) {
          transaction.completionBehavior =
            PostFinanceCheckout.model.TransactionCompletionBehavior.COMPLETE_DEFERRED;
        }
        if (totalAmount) {
          const lineItemSum = new PostFinanceCheckout.model.LineItemCreate();
          lineItemSum.name = `Bestellung ${orderPayment.orderId}`;
          lineItemSum.type = PostFinanceCheckout.model.LineItemType.FEE;
          lineItemSum.quantity = 1;
          lineItemSum.uniqueId = orderPayment.orderId;
          lineItemSum.amountIncludingTax = totalAmount / 100;
          transaction.lineItems = [lineItemSum];
        }
        const transactionId = await createTransaction(transaction);
        let location = null;
        if (integrationMode === IntegrationModes.PaymentPage) {
          location = await getPaymentPageUrl(transactionId);
        } else if (integrationMode === IntegrationModes.Lightbox) {
          location = await getLightboxJavascriptUrl(transactionId);
        } else if (integrationMode === IntegrationModes.iFrame) {
          location = await getIframeJavascriptUrl(transactionId);
        }
        const res: SignResponse = {
          transactionId,
          location,
        };

        return JSON.stringify(res);
      },

      charge: async ({
        transactionId,
        paymentCredentials,
      }: {
        transactionId: string;
        paymentCredentials: any;
      }) => {
        if (paymentCredentials && !transactionId) {
          // Directly charge the customer based on existing token!
          throw new Error('Not implemented yet');
        }
        if (!transactionId) return false; // checkout without payment

        const transaction = await getTransaction(transactionId);

        if (!transaction) {
          logger.error(`Transaction #${transactionId}: Transaction not found`);
          throw newError({
            code: `TRANSACTION_NOT_FOUND`,
            message: 'Payment declined',
          });
        }

        const isPaid = await orderIsPaid(context.order, transaction);
        if (!isPaid) {
          logger.error(`Transaction #${transactionId}: Invalid state / Amount incorrect`);
          throw newError({
            code: `STATE_${transaction.state?.toUpperCase()}`,
            message: 'Invalid state / Amount incorrect',
          });
        }

        if (transaction.metaData.orderPaymentId !== context.orderPayment._id) {
          logger.error(`Transaction #${transactionId}: Invalid state / Amount incorrect`);
          throw newError({
            code: `TRANSACTION_ALREADY_USED`,
            message: 'Transaction already used in previous checkout',
          });
        }

        const { id, ...tokenMeta } = transaction.token || {};

        return {
          transaction,
          transactionId,
          credentials: id && {
            ...tokenMeta,
            token: id.toString(),
          },
        } as PaymentChargeActionResult;
      },

      cancel: async () => {
        const { orderPayment, order } = context;
        const { transactionId } = orderPayment;
        if (!transactionId) {
          return false;
        }
        const transaction = await getTransaction(transactionId);
        const refund = transaction.state === PostFinanceCheckout.model.TransactionState.FULFILL;
        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currency: order.currency,
        });

        const totalAmount = pricing?.total({ useNetPrice: false }).amount;
        // For immediate settlements, try refunding. For deferred settlements, void the transaction.
        return (
          (refund && refundTransaction(transactionId, order._id, totalAmount / 100)) ||
          voidTransaction(transactionId)
        );
      },

      confirm: async () => {
        const { orderPayment } = context;
        const { transactionId } = orderPayment;
        if (!transactionId) {
          return false;
        }
        const transaction = await getTransaction(transactionId);
        if (transaction.state === PostFinanceCheckout.model.TransactionState.AUTHORIZED) {
          return confirmDeferredTransaction(transactionId);
        }
        return false;
      },
    };

    return adapter;
  },
};

PaymentDirector.registerAdapter(PostfinanceCheckout);
