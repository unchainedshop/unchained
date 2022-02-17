import { Context } from '@unchainedshop/types/api';
import { IPaymentAdapter } from '@unchainedshop/types/payments';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
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

useMiddlewareWithCurrentContext(PFCHECKOUT_SUCCESS_WEBHOOK_PATH, bodyParser.json());

useMiddlewareWithCurrentContext(PFCHECKOUT_SUCCESS_WEBHOOK_PATH, async (request, response) => {

});

useMiddlewareWithCurrentContext(PFCHECKOUT_FAIL_WEBHOOK_PATH, bodyParser.json());

useMiddlewareWithCurrentContext(PFCHECKOUT_FAIL_WEBHOOK_PATH, async (request, response) => {

});

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

    const getConfig = () => {
      return {
        space_id: PFCHECKOUT_SPACE_ID,
        user_id: PFCHECKOUT_USER_ID,
        api_secret: PFCHECKOUT_SECRET,
      };
    };

    const getTransactionService = () => {
      return new PostFinanceCheckout.api.TransactionService(getConfig());
    };

    const getTransactionPaymentPageService = () => {
      return new PostFinanceCheckout.api.TransactionPaymentPageService(getConfig());
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

      sign: async (transactionContext = {}) => {

      },

      charge: async () => {

      },

    };

    return adapter;
  },
};

PaymentDirector.registerAdapter(PostfinanceCheckout);
