import { createLogger } from '@unchainedshop/logger';
import stripeClient, { createOrderPaymentIntent, createRegistrationIntent } from './stripe.js';
import {
  OrderPricingSheet,
  IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
} from '@unchainedshop/core';

export * from './middleware.js';

const logger = createLogger('unchained:core-payment:stripe');

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

    const descriptorPrefix = config.find(({ key }) => key === 'descriptorPrefix')?.value;

    const getUserData = async (forcedUserId) => {
      const userId = forcedUserId || context?.userId;
      const user = await modules.users.findUserById(userId);
      const email = modules.users.primaryEmail(user)?.address;
      const name = user.profile.displayName || user.username || email;
      return {
        email,
        name,
        userId,
      };
    };
    const adapterActions = {
      ...PaymentAdapter.actions(config, context),

      configurationError() {
        const stripe = stripeClient();
        if (!stripe) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
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
        const stripe = stripeClient();
        const paymentMethod = await stripe.paymentMethods.retrieve(token);
        return !!paymentMethod;
      },

      register: async ({ setupIntentId }) => {
        const stripe = stripeClient();
        if (!setupIntentId) {
          throw new Error('You have to provide a setupIntentId');
        }

        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        if (setupIntent.status === 'succeeded') {
          return {
            token: setupIntent.payment_method,
            customer: setupIntent.customer,
            // payment_method_options: setupIntent.payment_method_options,
            payment_method_types: setupIntent.payment_method_types,
            usage: setupIntent.usage,
          };
        }

        logger.warn('Registration declined', setupIntentId);
        return null;
      },

      sign: async (transactionContext = {}) => {
        const { orderPayment, order, paymentProviderId } = context;

        if (orderPayment) {
          const pricing = OrderPricingSheet({
            calculation: order.calculation,
            currency: order.currency,
          });
          const { userId, name, email } = await getUserData(order?.userId);
          const paymentIntent = await createOrderPaymentIntent(
            { userId, name, email, order, orderPayment, pricing, descriptorPrefix },
            transactionContext,
          );
          return paymentIntent.client_secret;
        }

        const { userId, name, email } = await getUserData(order?.userId);
        const paymentIntent = await createRegistrationIntent(
          { userId, name, email, paymentProviderId, descriptorPrefix },
          transactionContext,
        );
        return paymentIntent.client_secret;
      },

      charge: async ({ paymentIntentId, paymentCredentials }) => {
        const stripe = stripeClient();
        if (!paymentIntentId && !paymentCredentials) {
          throw new Error('You have to provide paymentIntentId or paymentCredentials');
        }

        const { order } = context;
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId: order.paymentId,
        });
        const { userId, name, email } = await getUserData(order?.userId);
        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currency: order.currency,
        });

        const paymentIntentObject = paymentIntentId
          ? await stripe.paymentIntents.retrieve(paymentIntentId)
          : await createOrderPaymentIntent(
              { userId, name, email, orderPayment, order, pricing, descriptorPrefix },
              {
                customer: paymentCredentials.meta?.customer,
                confirm: true,
                payment_method: paymentCredentials.token,
                payment_method_types: paymentCredentials.meta?.payment_method_types, // eslint-disable-line
                // payment_method_options: paymentCredentials.meta?.payment_method_options, // eslint-disable-line
              },
            );

        const { currency, amount } = pricing.total({ useNetPrice: false });

        if (
          paymentIntentObject.currency !== currency.toLowerCase() ||
          paymentIntentObject.amount !== Math.round(amount)
        ) {
          throw new Error('The price has changed since the intent has been created');
        }
        if (paymentIntentObject.metadata?.orderPaymentId !== orderPayment?._id) {
          throw new Error('The order payment is different from the initiating intent');
        }

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
