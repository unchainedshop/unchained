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
} from './api';
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

    const SPACE_ID = parseInt(PFCHECKOUT_SPACE_ID, 10);

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

      validate: async ({ token }) => {

      },

      register: async () => {

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

      charge: async ({ transactionId }) => {
        // if you return true, the status will be changed to PAID
        // if you return false, the order payment status stays the
        // same but the order status might change
        // if you throw an error, you cancel the checkout process
      },

    };

    return adapter;
  },
};

PaymentDirector.registerAdapter(PostfinanceCheckout);
