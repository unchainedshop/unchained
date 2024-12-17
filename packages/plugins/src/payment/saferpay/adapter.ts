import { mongodb } from '@unchainedshop/mongodb';
import { PaymentPageInitializeInput, SaferpayClient } from './api/index.js';
import { buildSignature } from './buildSignature.js';
import { SaferpayTransactionsModule } from './module/configureSaferpayTransactionsModule.js';
import {
  OrderPricingSheet,
  IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
} from '@unchainedshop/core';

export * from './middleware.js';

const {
  SAFERPAY_BASE_URL = 'https://test.saferpay.com/api',
  SAFERPAY_CUSTOMER_ID,
  SAFERPAY_WEBHOOK_PATH = '/payment/saferpay/webhook',
  SAFERPAY_RETURN_PATH = '/saferpay/return',
  ROOT_URL = 'http://localhost:4010',
  EMAIL_WEBSITE_URL,
  SAFERPAY_USER,
  SAFERPAY_PW,
} = process.env;

const newSaferpayError = ({ code, message }: { code: string; message?: string }) => {
  const error = new Error(message || code);
  error.name = `SAFERPAY_${code}`;
  return error;
};

const addTransactionId = (urlString, saferpayTransactionId) => {
  const urlWithTransactionId = new URL(urlString);
  urlWithTransactionId.searchParams.append('transactionId', saferpayTransactionId.toString('hex'));
  return urlWithTransactionId.href;
};

export const WordlineSaferpay: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.saferpay',
  label: 'Worldline Saferpay API',
  version: '1.38.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (config, context) => {
    const { modules } = context as typeof context & {
      modules: { saferpayTransactions: SaferpayTransactionsModule };
    };

    const createSaferPayClient = () => {
      if (!SAFERPAY_CUSTOMER_ID || !SAFERPAY_USER || !SAFERPAY_PW)
        throw new Error('Credentials not Set');
      const saferpayClient = new SaferpayClient(
        SAFERPAY_BASE_URL,
        SAFERPAY_CUSTOMER_ID,
        SAFERPAY_USER,
        SAFERPAY_PW,
      );
      return saferpayClient;
    };

    const adapter = {
      ...PaymentAdapter.actions(config, context),

      getTerminalId() {
        return config.find((item) => item.key === 'terminalId')?.value;
      },

      // eslint-disable-next-line
      configurationError() {
        // eslint-disable-line
        if (
          !SAFERPAY_BASE_URL ||
          !SAFERPAY_CUSTOMER_ID ||
          !SAFERPAY_USER ||
          !SAFERPAY_PW ||
          !adapter.getTerminalId()
        ) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null as unknown as PaymentError;
      },

      isActive() {
        if (adapter.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      sign: async (transactionContext: any = {}) => {
        const { orderPayment, order } = context;

        if (!orderPayment || !order) {
          throw new Error('orderPayment or order not found');
        }
        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currency: order.currency,
        });
        const totalAmount = pricing?.total({ useNetPrice: false }).amount;

        const saferpayTransactionId = await modules.saferpayTransactions.createTransaction(
          orderPayment._id,
        );

        const signature = await buildSignature(saferpayTransactionId.toString('hex'), orderPayment._id);
        const paymentPageInitInput: PaymentPageInitializeInput = {
          ...(transactionContext || {}),
          TerminalId: adapter.getTerminalId(),
          Payment: {
            Amount: {
              Value: totalAmount.toString(),
              CurrencyCode: order.currency,
            },
            OrderId: order._id,
            Description: transactionContext.description || 'Bestellung',
            ...(transactionContext?.Payment || {}),
          },
          ReturnUrl: {
            Url: `${EMAIL_WEBSITE_URL || ROOT_URL}${SAFERPAY_RETURN_PATH}`,
            ...(transactionContext?.ReturnUrl || {}),
          },
          Notification: {
            SuccessNotifyUrl: `${ROOT_URL}${SAFERPAY_WEBHOOK_PATH}?orderPaymentId=${orderPayment._id}&signature=${signature}`,
          },
        };

        paymentPageInitInput.ReturnUrl.Url = addTransactionId(
          paymentPageInitInput.ReturnUrl.Url,
          saferpayTransactionId,
        );

        paymentPageInitInput.Notification.SuccessNotifyUrl = addTransactionId(
          paymentPageInitInput.Notification.SuccessNotifyUrl,
          saferpayTransactionId,
        );

        const api = createSaferPayClient();
        const paymentPageInit = await api.paymentPageInitialize(orderPayment, paymentPageInitInput);

        await modules.saferpayTransactions.setToken(saferpayTransactionId, paymentPageInit.Token);

        return JSON.stringify({
          location: paymentPageInit.RedirectUrl,
          token: paymentPageInit.Token,
          transactionId: saferpayTransactionId.toString('hex'),
        });
      },

      charge: async ({ transactionId }: { transactionId: string }) => {
        const { orderPayment, order } = context;

        if (!orderPayment || !order) {
          throw new Error('orderPayment or order not found');
        }
        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currency: order.currency,
        });
        const totalAmount = pricing.total({ useNetPrice: false }).amount;

        const saferpayTransaction = await modules.saferpayTransactions.findTransactionById(
          mongodb.ObjectId.createFromHexString(transactionId),
        );

        const api = createSaferPayClient();
        const paymentPageAssert = await api.paymentPageAssert(orderPayment, {
          Token: saferpayTransaction.token,
        });

        const success =
          !paymentPageAssert.ErrorMessage &&
          paymentPageAssert.Transaction.Amount.Value === totalAmount.toString() &&
          paymentPageAssert.Transaction.Amount.CurrencyCode === order.currency &&
          (paymentPageAssert.Transaction.Status === 'AUTHORIZED' ||
            paymentPageAssert.Transaction.Status === 'CAPTURED');
        if (success) {
          return {
            transactionId,
            settledTransaction: paymentPageAssert.Transaction,
            // arbitraryFields,
            // credentials,
          };
        }

        throw newSaferpayError({
          code: paymentPageAssert.ErrorName || `WRONG_STATUS_${paymentPageAssert.Transaction.Status}`,
          message: paymentPageAssert.ErrorMessage,
        });
      },

      async confirm() {
        const { orderPayment } = context;

        if (!orderPayment) {
          throw new Error('orderPayment not found');
        }
        const { transactionId } = orderPayment;
        if (!transactionId) return false;

        const saferpayTransaction = await modules.saferpayTransactions.findTransactionById(
          mongodb.ObjectId.createFromHexString(transactionId),
        );

        const api = createSaferPayClient();
        const paymentPageAssert = await api.paymentPageAssert(orderPayment, {
          Token: saferpayTransaction.token,
        });

        if (paymentPageAssert.Behavior === 'DO_NOT_RETRY') return false;

        if (paymentPageAssert.Transaction.Status !== 'AUTHORIZED') return false;
        const transactionCaptureRes = await api.transactionCapture(orderPayment, {
          TransactionReference: {
            TransactionId: paymentPageAssert.Transaction.Id,
          },
        });

        return transactionCaptureRes.Status === 'CAPTURED';
      },

      cancel: async () => {
        const { orderPayment } = context;

        if (!orderPayment) {
          throw new Error('orderPayment not found');
        }

        const { transactionId } = orderPayment;
        if (!transactionId) return false;

        const saferpayTransaction = await modules.saferpayTransactions.findTransactionById(
          mongodb.ObjectId.createFromHexString(transactionId),
        );

        const api = createSaferPayClient();
        const paymentPageAssert = await api.paymentPageAssert(orderPayment, {
          Token: saferpayTransaction.token,
        });

        if (paymentPageAssert.Behavior === 'DO_NOT_RETRY') return false;

        if (paymentPageAssert.Transaction.Status !== 'AUTHORIZED') return false;
        const transactionCancelRes = await api.transactionCancel(orderPayment, {
          TransactionReference: {
            TransactionId: paymentPageAssert.Transaction.Id,
          },
        });

        return transactionCancelRes.TransactionId === transactionId;
      },
    };

    return adapter;
  },
};

PaymentDirector.registerAdapter(WordlineSaferpay);
