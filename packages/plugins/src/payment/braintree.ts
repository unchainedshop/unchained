import { createLogger } from '@unchainedshop/logger';
import {
  type IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
  OrderPricingSheet,
} from '@unchainedshop/core';
const logger = createLogger('unchained:braintree');

const { BRAINTREE_SANDBOX_TOKEN, BRAINTREE_PRIVATE_KEY } = process.env;

let braintree: any;
try {
  // eslint-disable-next-line
  // @ts-ignore
  const braintreePackage = await import('braintree');
  braintree = braintreePackage.default;
} catch {
  /* */
  logger.warn("npm dependency 'braintree' is not installed, paypal adapter will not work");
}

const BraintreeDirect: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.braintree-direct',
  label: 'Braintree Direct',
  version: '1.0.0',

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

  actions: (config, context) => {
    const getPublicKey = () => {
      return config.reduce((current, item) => {
        if (item.key === 'publicKey') return item.value;
        return current;
      }, null);
    };

    const getMerchantId = () => {
      return config.reduce((current, item) => {
        if (item.key === 'merchantId') return item.value;
        return current;
      }, null);
    };

    const getAccessToken = () => {
      return BRAINTREE_SANDBOX_TOKEN;
    };

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
      ...PaymentAdapter.actions(config, context),

      configurationError: () => {
        const publicCredentialsValid =
          getAccessToken() || (getMerchantId() && getPublicKey() && getPrivateKey());

        if (!publicCredentialsValid) {
          return PaymentError.WRONG_CREDENTIALS;
        }
        return null;
      },

      isActive: () => {
        if (adapter.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed: () => {
        return false;
      },

      sign: async () => {
        const gateway = getGateway(braintree);
        const result = await gateway.clientToken.generate({});
        if (result.success) {
          return result.clientToken;
        }
        throw new Error('Could not retrieve the client token');
      },

      charge: async ({ paypalPaymentMethodNonce }) => {
        const { order } = context;

        if (!order) throw new Error('Order is missing in payment context');

        if (!paypalPaymentMethodNonce)
          throw new Error('You have to provide paypalPaymentMethodNonce in paymentContext');

        const gateway = getGateway(braintree);
        const address = order.billingAddress;
        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currencyCode: order.currencyCode,
        });
        const rounded = Math.round(pricing.total({ useNetPrice: false }).amount / 10 || 0) * 10;
        const saleRequest = {
          amount: rounded / 100,
          merchantAccountId: order.currencyCode,
          paymentMethodNonce: paypalPaymentMethodNonce,
          orderId: order.orderNumber || order._id,
          shipping: address
            ? {
                firstName: address.firstName,
                lastName: address.lastName,
                company: address.company,
                streetAddress: address.addressLine,
                extendedAddress: address.addressLine2,
                locality: address.city,
                region: address.regionCode,
                postalCode: address.postalCode,
                countryCodeAlpha2: address.countryCode,
              }
            : undefined,
          options: {
            submitForSettlement: true,
          },
        };
        const result = await gateway.transaction.sale(saleRequest);
        if (result.success) {
          logger.info(`Braintree Plugin: ${result.message}`, saleRequest);
          return result;
        }
        logger.warn(`Braintree Plugin: ${result.message}`, saleRequest);
        throw new Error(result.message);
      },
    };

    return adapter;
  },
};

PaymentDirector.registerAdapter(BraintreeDirect);
