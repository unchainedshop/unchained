import { createLogger } from '@unchainedshop/logger';
import { stripe } from './stripe.ts';
import { createRegistrationIntent, retrieveSetupIntentCredentials } from './setup-intents.ts';
import {
  createAcpSharedPaymentTokenIntent,
  createOrderPaymentIntent,
  createStoredCredentialPaymentIntent,
  retrievePaymentIntent,
} from './payment-intents.ts';
import { assertPaymentIntentMatchesOrderPayment } from './metadata.ts';
import { normalizeStripeChargeRequest } from './charge-request.ts';
import {
  OrderPricingSheet,
  type IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
} from '@unchainedshop/core';

const logger = createLogger('unchained:stripe');

const Stripe: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.stripe',
  label: 'Stripe',
  version: '2.0.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (config, context) => {
    const { modules } = context;

    const descriptorPrefix = config.find(({ key }) => key === 'descriptorPrefix')?.value || '';

    const assertUserData = async (forcedUserId) => {
      const userId = forcedUserId || context?.userId;
      const user = await modules.users.findUserById(userId);
      if (!user) throw new Error('User not found');
      const email = modules.users.primaryEmail(user)?.address;
      const name = user.profile?.displayName || user.username || email;
      return {
        email,
        name,
        userId,
      };
    };
    const adapterActions = {
      ...PaymentAdapter.actions(config, context),

      configurationError() {
        if (!stripe) return PaymentError.INCOMPLETE_CONFIGURATION;
        return null;
      },

      isActive: () => {
        if (adapterActions.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      validate: async ({ token }) => {
        const paymentMethod = await stripe.paymentMethods.retrieve(token);
        return !!paymentMethod;
      },

      register: async ({ setupIntentId }) => {
        return retrieveSetupIntentCredentials({ setupIntentId });
      },

      sign: async (transactionContext = {}) => {
        const { orderPayment, order, paymentProvider } = context;
        const { userId, name, email } = await assertUserData(order?.userId);
        if (orderPayment) {
          if (!order) throw new Error('order not found in context');
          const pricing = OrderPricingSheet({
            calculation: order?.calculation,
            currencyCode: order?.currencyCode,
          });
          const paymentIntent = await createOrderPaymentIntent(
            { userId, name, email, order, orderPayment, pricing, descriptorPrefix },
            transactionContext,
          );
          return paymentIntent.client_secret;
        }

        const paymentIntent = await createRegistrationIntent(
          { userId, name, email, paymentProviderId: paymentProvider._id, descriptorPrefix },
          transactionContext,
        );
        return paymentIntent.client_secret;
      },

      charge: async (transactionContext = {}) => {
        const chargeRequest = normalizeStripeChargeRequest(transactionContext);
        const { order, orderPayment } = context;

        if (!order) throw new Error('order not found in context');
        if (!orderPayment) throw new Error('orderPayment not found in context');

        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currencyCode: order.currencyCode,
        });

        if (chargeRequest.mode === 'acp-spt') {
          const paymentIntentObject = await createAcpSharedPaymentTokenIntent({
            acpToken: chargeRequest.acpToken,
            order,
            orderPayment,
            pricing,
            descriptorPrefix,
          });

          if (paymentIntentObject.status === 'succeeded') {
            return {
              transactionId: paymentIntentObject.id,
              status: paymentIntentObject.status,
              paymentMethod: paymentIntentObject.payment_method,
            };
          }

          logger.info('ACP SPT charge postponed because paymentIntent has wrong status', {
            orderPaymentId: paymentIntentObject.id,
          });

          return false;
        }

        const { userId, name, email } = await assertUserData(order?.userId);
        const paymentIntentObject =
          chargeRequest.mode === 'payment-intent'
            ? await retrievePaymentIntent(chargeRequest.paymentIntentId)
            : await createStoredCredentialPaymentIntent({
                userId,
                name,
                email,
                orderPayment,
                order,
                pricing,
                descriptorPrefix,
                paymentCredentials: chargeRequest.paymentCredentials,
              });

        assertPaymentIntentMatchesOrderPayment({
          paymentIntent: paymentIntentObject,
          orderPayment,
          pricing,
        });

        if (paymentIntentObject.status === 'succeeded') {
          return paymentIntentObject;
        }

        logger.info('Charge postponed because paymentIntent has wrong status', {
          orderPaymentId: paymentIntentObject.id,
        });

        return false;
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Stripe);
