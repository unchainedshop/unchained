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
import { Users } from 'meteor/unchained:core-users';

const {
  CRYPTOPAY_SECRET,
  CRYPTOPAY_WEBHOOK_PATH = '/graphql/cryptopay',
} = process.env;

useMiddlewareWithCurrentContext(CRYPTOPAY_WEBHOOK_PATH, bodyParser.raw({ type: 'application/json' }));

useMiddlewareWithCurrentContext(CRYPTOPAY_WEBHOOK_PATH, async (request, response) => {
  // Return a 200 response to acknowledge receipt of the event
  response.end(JSON.stringify({ received: true }));
});

const Cryptopay: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.cryptopay',
  label: 'Cryptopay',
  version: '1.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const { modules } = params.context;

    const adapterActions = {
      ...PaymentAdapter.actions(params),

      // eslint-disable-next-line
      configurationError() {
        // eslint-disable-line
        if (!CRYPTOPAY_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive() {
        if (this.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      validate: async (token) => {
        // TODO
      },

      register: async ({ setupIntentId }) => {
        if (!setupIntentId) {
          throw new Error('You have to provide a setup intent id');
        }
        // TODO
      },

      sign: async ({ transactionContext = {} } = {}) => {
        // eslint-disable-line
        // TODO
      },

      charge: async ({ paymentIntentId, paymentCredentials }) => {
        if (!paymentIntentId && !paymentCredentials) {
          throw new Error('You have to provide an existing intent or a payment method');
        }
        // TODO
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Cryptopay);
