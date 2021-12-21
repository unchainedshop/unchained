import { IPaymentAdapter } from '@unchainedshop/types/payments';
import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';

const { BRAINTREE_SANDBOX_TOKEN, BRAINTREE_PRIVATE_KEY } = process.env;

const BraintreeDirect: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.braintree-direct',
  label: 'Braintree Direct',
  version: '1.0',

  initialConfiguration: [
    {
      key: 'publicKey',
      value: null,
    },
    {
      key: 'merchantId',
      value: null,
    },
  ],

  typeSupported: (type) => {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const getPublicKey = () => {
      return params.config.reduce((current, item) => {
        if (item.key === 'publicKey') return item.value;
        return current;
      }, null);
    };

    const getMerchantId = () => {
      return params.config.reduce((current, item) => {
        if (item.key === 'merchantId') return item.value;
        return current;
      }, null);
    };

    const getAccessToken = () => {
      return BRAINTREE_SANDBOX_TOKEN;
    };

    // eslint-disable-next-line
    const getPrivateKey = () => {
      return BRAINTREE_PRIVATE_KEY;
    };

    const getGateway = (braintree) => {
      const accessToken = getAccessToken();
      if (accessToken) {
        // sandbox mode!
        return braintree.connect({
          accessToken,
        });
      }
      return braintree.connect({
        environment: braintree.Environment.Production,
        merchantId: getMerchantId(),
        publicKey: getPublicKey(),
        privateKey: getPrivateKey(),
      });
    };

    const adapter = {
      ...PaymentAdapter.actions(params),

      configurationError: async () => {
        const publicCredentialsValid =
          getAccessToken() ||
          (getMerchantId() && getPublicKey() && getPrivateKey());

        if (!publicCredentialsValid) {
          return PaymentError.WRONG_CREDENTIALS;
        }
        return null;
      },

      isActive: async () => {
        if (!(await adapter.configurationError())) return true;
        return false;
      },

      isPayLaterAllowed: () => {
        return false;
      },

      sign: async () => {
        const braintree = require('braintree'); // eslint-disable-line
        const gateway = getGateway(braintree);
        const result = await gateway.clientToken.generate({});
        if (result.success) {
          return result.clientToken;
        }
        throw new Error('Could not retrieve the client token');
      },

      charge: async ({ paypalPaymentMethodNonce }) => {
        if (!paypalPaymentMethodNonce)
          throw new Error(
            'You have to provide paypalPaymentMethodNonce in paymentContext'
          );
        const braintree = require('braintree'); // eslint-disable-line
        const gateway = getGateway(braintree);
        const address = params.context.order.billingAddress || {};
        // TODO: use modules
        /* @ts-ignore */
        const pricing = params.context.order.pricing();
        const rounded = Math.round(pricing.total().amount / 10 || 0) * 10;
        const saleRequest = {
          amount: rounded / 100,
          merchantAccountId: params.context.order.currency,
          paymentMethodNonce: paypalPaymentMethodNonce,
          orderId: params.context.order.orderNumber || params.context.order._id,
          shipping: {
            firstName: address.firstName,
            lastName: address.lastName,
            company: address.company,
            streetAddress: address.addressLine,
            extendedAddress: address.addressLine2,
            locality: address.city,
            region: address.regionCode,
            postalCode: address.postalCode,
            countryCodeAlpha2: address.countryCode,
          },
          options: {
            submitForSettlement: true,
          },
        };
        const result = await gateway.transaction.sale(saleRequest);
        if (result.success) {
          paymentLogger.info(
            `Braintree Plugin: ${result.message}`,
            saleRequest
          );
          return result;
        }
        paymentLogger.warn(`Braintree Plugin: ${result.message}`, saleRequest);
        throw new Error(result.message);
      },
    };

    return adapter
  },
};

PaymentDirector.registerAdapter(BraintreeDirect);
