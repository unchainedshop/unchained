import { Context } from '@unchainedshop/types/api';
import { IPaymentAdapter } from '@unchainedshop/types/payments';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { OrderPricingSheet } from 'meteor/unchained:core-orders';
import {
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';
import { PostFinanceCheckout } from 'postfinancecheckout';

const {
  PFCHECKOUT_SPACE_ID,
  PFCHECKOUT_USER_ID,
  PFCHECKOUT_SECRET,
  PFCHECKOUT_SUCCESS_WEBHOOK_PATH = '/graphql/postfinance-checkout-success',
  PFCHECKOUT_FAIL_WEBHOOK_PATH = '/graphql/postfinance-checkout-fail',
} = process.env;

// useMiddlewareWithCurrentContext(PFCHECKOUT_SUCCESS_WEBHOOK_PATH, bodyParser.json());

// useMiddlewareWithCurrentContext(PFCHECKOUT_SUCCESS_WEBHOOK_PATH, async (request, response) => {

// });

// useMiddlewareWithCurrentContext(PFCHECKOUT_FAIL_WEBHOOK_PATH, bodyParser.json());

// useMiddlewareWithCurrentContext(PFCHECKOUT_FAIL_WEBHOOK_PATH, async (request, response) => {

// });

enum IntegrationModes {
  PaymentPage = 'PaymentPage',
  Lightbox = 'Lightbox',
  iFrame = 'iFrame',
}

type SignResponse = {
  transactionId: number;
  location: string | null;
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

    const SPACE_ID = parseInt(PFCHECKOUT_SPACE_ID, 10);
    const USER_ID = parseInt(PFCHECKOUT_USER_ID, 10);

    const getConfig = () => {
      return {
        space_id: SPACE_ID,
        user_id: USER_ID,
        api_secret: PFCHECKOUT_SECRET,
      };
    };

    const getTransactionService = () => {
      return new PostFinanceCheckout.api.TransactionService(getConfig());
    };

    const getTransactionPaymentPageService = () => {
      return new PostFinanceCheckout.api.TransactionPaymentPageService(getConfig());
    };

    const getTransactionIframeService = () => {
      return new PostFinanceCheckout.api.TransactionIframeService(getConfig());
    };

    const getTransactionLightboxService = () => {
      return new PostFinanceCheckout.api.TransactionLightboxService(getConfig());
    };

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
        // Option for fetching payment methods (iFrame / Lightbox) -> Return id, JS url, possible payment methods
        const { orderPayment } = params.paymentContext;
        const transactionService = getTransactionService();
        const order = await modules.orders.findOrder({
          orderId: orderPayment.orderId,
        });
        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currency: order.currency,
        });
        const totalAmount = pricing?.total({ useNetPrice: false }).amount;
        const transaction = new PostFinanceCheckout.model.TransactionCreate();
        transaction.currency = order.currency;
        if (totalAmount) {
          const lineItemSum = new PostFinanceCheckout.model.LineItemCreate();
          lineItemSum.name = `Bestellung ${orderPayment.orderId}`;
          lineItemSum.type = PostFinanceCheckout.model.LineItemType.FEE;
          lineItemSum.quantity = 1;
          lineItemSum.uniqueId = orderPayment.orderId;
          lineItemSum.amountIncludingTax = totalAmount / 100;
          transaction.lineItems = [lineItemSum];
        }
        const transactionCreateRes = await transactionService.create(SPACE_ID, transaction);
        const transactionCreate = transactionCreateRes.body;
        const transactionId = transactionCreate.id;
        let location = null;
        if (integrationMode === IntegrationModes.PaymentPage) {
          const transactionPaymentPageService = getTransactionPaymentPageService();
          const paymentPageUrl = await transactionPaymentPageService.paymentPageUrl(
            SPACE_ID,
            transactionId,
          );
          location = paymentPageUrl.body;
        } else if (integrationMode === IntegrationModes.Lightbox) {
          const transactionLightboxService = getTransactionLightboxService();
          const javascriptUrl = await transactionLightboxService.javascriptUrl(SPACE_ID, transactionId);
          location = javascriptUrl.body;
        } else if (integrationMode === IntegrationModes.iFrame) {
          const transactionIframeService = getTransactionIframeService();
          const iframeUrl = await transactionIframeService.javascriptUrl(SPACE_ID, transactionId);
          location = iframeUrl.body;
        }
        const res: SignResponse = {
          transactionId,
          location,
        };

        return JSON.stringify(res);
      },

      charge: async () => {
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
