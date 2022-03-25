import { IPaymentActions, IPaymentAdapter } from '@unchainedshop/types/payments';
import { PaymentAdapter, PaymentDirector, PaymentError } from 'meteor/unchained:core-payment';
import { TransactionCompletionBehavior } from 'postfinancecheckout/src/models/TransactionCompletionBehavior';
import { PostFinanceCheckout } from 'postfinancecheckout';
import { createLogger } from 'meteor/unchained:logger';
import { CreationEntityState } from 'postfinancecheckout/src/models/CreationEntityState';
import { TransactionState } from 'postfinancecheckout/src/models/TransactionState';
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
} from './api';
import { orderIsPaid } from './utils';
import './middleware';
import { CompletionModes, IntegrationModes, SignResponse } from './types';

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

const PostfinanceCheckout: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.postfinance-checkout',
  label: 'Postfinance Checkout',
  version: '1.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const { modules } = params.context;

    const adapter: IPaymentActions & {
      getCompletionMode: () => CompletionModes;
    } = {
      ...PaymentAdapter.actions(params),

      getCompletionMode() {
        return (
          (params.config.find((item) => item.key === 'completionMode')?.value as CompletionModes) ||
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
        return tokenData.state === CreationEntityState.ACTIVE;
      },

      sign: async (transactionContext: any = {}) => {
        const { integrationMode = IntegrationModes.PaymentPage }: { integrationMode: IntegrationModes } =
          transactionContext;
        const completionMode = adapter.getCompletionMode();
        const { orderPayment } = params.paymentContext;
        const order = await modules.orders.findOrder({
          orderId: orderPayment.orderId,
        });
        const pricing = modules.orders.pricingSheet(order);
        const totalAmount = pricing?.total({ useNetPrice: false }).amount;
        const transaction = new PostFinanceCheckout.model.TransactionCreate();
        transaction.currency = order.currency;
        transaction.metaData = {
          orderPaymentId: orderPayment._id,
        };
        transaction.successUrl = `${PFCHECKOUT_SUCCESS_URL}?order_id=${orderPayment.orderId}`;
        transaction.failedUrl = `${PFCHECKOUT_FAILED_URL}?order_id=${orderPayment.orderId}`;
        transaction.customerId = params.context.user._id;
        transaction.tokenizationMode =
          PostFinanceCheckout.model.TokenizationMode.ALLOW_ONE_CLICK_PAYMENT;
        if (completionMode === CompletionModes.Immediate) {
          transaction.completionBehavior = TransactionCompletionBehavior.COMPLETE_IMMEDIATELY;
        } else if (completionMode === CompletionModes.Deferred) {
          transaction.completionBehavior = TransactionCompletionBehavior.COMPLETE_DEFERRED;
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

        const isPaid = await orderIsPaid(params.paymentContext.order, transaction, modules.orders);
        if (!isPaid) {
          logger.error(`Transaction #${transactionId}: Invalid state / Amount incorrect`);
          throw newError({
            code: `STATE_${transaction.state?.toUpperCase()}`,
            message: 'Invalid state / Amount incorrect',
          });
        }

        if (transaction.metaData.orderPaymentId !== params.paymentContext.orderPayment._id) {
          logger.error(`Transaction #${transactionId}: Invalid state / Amount incorrect`);
          throw newError({
            code: `TRANSACTION_ALREADY_USED`,
            message: 'Transaction already used in previous checkout',
          });
        }

        const { token: { id, ...tokenMeta } = {} } = transaction;

        return {
          transaction,
          transactionId,
          credentials: id && {
            ...tokenMeta,
            token: id,
          },
        };
      },

      cancel: async () => {
        const { orderPayment } = params.paymentContext;
        const { transactionId } = orderPayment;
        if (!transactionId) {
          return false;
        }
        const transaction = await getTransaction(transactionId);
        const refund = transaction.state === TransactionState.FULFILL;
        const order = await modules.orders.findOrder({
          orderId: orderPayment.orderId,
        });
        const pricing = modules.orders.pricingSheet(order);
        const totalAmount = pricing?.total({ useNetPrice: false }).amount;
        // For immediate settlements, try refunding. For deferred settlements, void the transaction.
        return (
          (refund && refundTransaction(transactionId, order._id, totalAmount / 100)) ||
          voidTransaction(transactionId)
        );
      },

      confirm: async () => {
        const { orderPayment } = params.paymentContext;
        const { transactionId } = orderPayment;
        if (!transactionId) {
          return false;
        }
        const transaction = await getTransaction(transactionId);
        if (transaction.state === TransactionState.AUTHORIZED) {
          return confirmDeferredTransaction(transactionId);
        }
        return false;
      },
    };

    return adapter;
  },
};

PaymentDirector.registerAdapter(PostfinanceCheckout);
