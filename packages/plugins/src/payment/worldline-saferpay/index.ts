import { IPaymentAdapter, PaymentChargeActionResult } from '@unchainedshop/types/payments';
import { PaymentAdapter, PaymentDirector, PaymentError } from '@unchainedshop/core-payment';
import { PaymentPageInitializeInput, SaferpayClient } from './worldline-saferpay-client';

const {
  WORLDLINE_BASE_URL = 'https://test.saferpay.com/api',
  WORLDLINE_CUSTOMER_ID,
  WORLDLINE_USER,
  WORLDLINE_PW,
  WORLDLINE_SUCCESS_URL,
  WORLDLINE_FAILED_URL,
} = process.env;

const WordlineSaferpay: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.worldline-saferpay',
  label: 'Worldline Saferpay',
  version: '1.0.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const { modules } = params.context;

    const saferpayClient = new SaferpayClient(
      WORLDLINE_BASE_URL,
      WORLDLINE_CUSTOMER_ID,
      WORLDLINE_USER,
      WORLDLINE_PW,
    );

    const adapter = {
      ...PaymentAdapter.actions(params),

      getTerminalId() {
        return params.config.find((item) => item.key === 'terminalId')?.value;
      },

      // eslint-disable-next-line
      configurationError() {
        // eslint-disable-line
        if (
          !WORLDLINE_BASE_URL ||
          !WORLDLINE_CUSTOMER_ID ||
          !WORLDLINE_USER ||
          !WORLDLINE_PW ||
          !adapter.getTerminalId()
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

      sign: async (transactionContext: any = {}) => {
        const { orderPayment, order } = params.paymentContext;
        const pricing = modules.orders.pricingSheet(order);
        const totalAmount = pricing?.total({ useNetPrice: false }).amount;
        const paymentPageInitInput: PaymentPageInitializeInput = {
          RequestHeader: saferpayClient.buildRequestHeader(orderPayment._id, 0),
          TerminalId: adapter.getTerminalId(),
          Payment: {
            Amount: {
              Value: totalAmount.toString(),
              CurrencyCode: order.currency,
            },
            OrderId: order._id,
            Description: transactionContext.description || 'Bestellung',
          },
          ReturnUrls: {
            Success: `${WORLDLINE_SUCCESS_URL}?order_id=${order._id}`,
            Fail: `${WORLDLINE_FAILED_URL}?order_id=${order._id}`,
            Abort: `${WORLDLINE_FAILED_URL}?order_id=${order._id}`,
          },
        };
        const paymentPageInit = await saferpayClient.paymentPageInitialize(paymentPageInitInput);
        return JSON.stringify({
          location: paymentPageInit.RedirectUrl,
          transactionId: paymentPageInit.Token,
        });
      },

      charge: async ({ transactionId }: { transactionId: string }) => {
        const { orderPayment, order } = params.paymentContext;
        const pricing = modules.orders.pricingSheet(order);
        const totalAmount = pricing.total({ useNetPrice: false }).amount;
        const paymentPageAssert = await saferpayClient.paymentPageAssert({
          RequestHeader: saferpayClient.buildRequestHeader(orderPayment._id, 0),
          Token: transactionId,
        });
        const success =
          !paymentPageAssert.ErrorMessage &&
          paymentPageAssert.Transaction.Amount.Value === totalAmount.toString() &&
          paymentPageAssert.Transaction.Amount.CurrencyCode === order.currency &&
          (paymentPageAssert.Transaction.Status === 'AUTHORIZED' ||
            paymentPageAssert.Transaction.Status === 'CAPTURED');
        if (success) {
          return paymentPageAssert.Transaction as PaymentChargeActionResult;
        }
        return false;
      },

      cancel: async () => {
        const { orderPayment } = params.paymentContext;
        if (!orderPayment) return false;
        const token = orderPayment.context?.token;
        if (!token) return false;
        const paymentPageAssert = await saferpayClient.paymentPageAssert({
          RequestHeader: saferpayClient.buildRequestHeader(orderPayment._id, 0),
          Token: token,
        });
        const transactionId = paymentPageAssert.Transaction?.Id;
        if (paymentPageAssert.Transaction.Status !== 'AUTHORIZED' || !transactionId) return false;
        const transactionCancelRes = await saferpayClient.transactionCancel({
          RequestHeader: saferpayClient.buildRequestHeader(orderPayment._id, 0),
          TransactionReference: {
            TransactionId: transactionId,
          },
        });
        return transactionCancelRes.TransactionId === transactionId;
      },
    };

    return adapter;
  },
};

PaymentDirector.registerAdapter(WordlineSaferpay);
