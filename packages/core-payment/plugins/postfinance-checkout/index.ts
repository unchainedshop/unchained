import { IPaymentAdapter } from '@unchainedshop/types/payments';
import {
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';
import { PostFinanceCheckout } from 'postfinancecheckout';
import {
  createTransaction,
  getIframeJavascriptUrl,
  getLightboxJavascriptUrl,
  getPaymentPageUrl,
  getTransaction,
  refundTransaction,
  voidTransaction,
} from './api';
import { markOrderAsPaid } from './utils';
import './middleware';
import { IntegrationModes, SignResponse } from './types';

const {
  PFCHECKOUT_SPACE_ID,
  PFCHECKOUT_USER_ID,
  PFCHECKOUT_SECRET,
  PFCHECKOUT_SUCCESS_URL,
  PFCHECKOUT_FAILED_URL,
} = process.env;

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

    const adapter = {
      ...PaymentAdapter.actions(params),

      // eslint-disable-next-line
      configurationError() {
        // eslint-disable-line
        if (!PFCHECKOUT_SPACE_ID || !PFCHECKOUT_USER_ID || !PFCHECKOUT_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive: async () => {
        if (adapter.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      sign: async (transactionContext: any = {}) => {
        const { integrationMode = IntegrationModes.PaymentPage }: { integrationMode: IntegrationModes } =
          transactionContext;
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
        transaction.successUrl = PFCHECKOUT_SUCCESS_URL;
        transaction.failedUrl = PFCHECKOUT_FAILED_URL;
        transaction.customerId = params.context.user._id;
        transaction.tokenizationMode =
          PostFinanceCheckout.model.TokenizationMode.ALLOW_ONE_CLICK_PAYMENT;
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

        await modules.orders.payments.updateContext(
          orderPayment._id,
          { orderId: order._id, context: transactionId },
          params.context,
        );

        return JSON.stringify(res);
      },

      charge: async () => {
        const { orderPayment } = params.paymentContext;
        const transactionId = orderPayment.context?.transactionId;
        if (!transactionId) {
          return false;
        }
        const transaction = await getTransaction(transactionId);
        return markOrderAsPaid(transaction, modules.orders);
      },

      cancel: async (transactionContext: any = {}) => {
        const { refund = false } = transactionContext;
        const { orderPayment } = params.paymentContext;
        const order = await modules.orders.findOrder({
          orderId: orderPayment.orderId,
        });
        const pricing = modules.orders.pricingSheet(order);
        const totalAmount = pricing?.total({ useNetPrice: false }).amount;
        const transactionId = orderPayment.context?.transactionId;
        if (!transactionId) {
          return false;
        }
        const voidRes = await voidTransaction(transactionId);
        if (!voidRes && refund) {
          return refundTransaction(transactionId, order._id, totalAmount);
        }
        return voidRes;
      },
    };

    return adapter;
  },
};

PaymentDirector.registerAdapter(PostfinanceCheckout);
