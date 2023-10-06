import { IPaymentAdapter } from '@unchainedshop/types/payments.js';
import { PaymentAdapter, PaymentDirector, PaymentError } from '@unchainedshop/core-payment';
import { createLogger } from '@unchainedshop/logger';
import stripe, { createOrderPaymentIntent, createRegistrationIntent } from './stripe.js';

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

  actions: (params) => {
    const { modules } = params.context;

    const adapterActions = {
      ...PaymentAdapter.actions(params),

      configurationError() {
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
        const paymentMethod = await stripe.paymentMethods.retrieve(token);
        return !!paymentMethod;
      },

      register: async ({ setupIntentId }) => {
        if (!setupIntentId) {
          throw new Error('You have to provide a setupIntentId');
        }

        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        logger.verbose(setupIntent);
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
        // eslint-disable-line
        const { orderPayment, order, paymentProviderId } = params.paymentContext;

        if (orderPayment) {
          const pricing = await modules.orders.pricingSheet(order);
          const paymentIntent = await createOrderPaymentIntent(
            { order, orderPayment, pricing },
            transactionContext,
          );
          return paymentIntent.client_secret;
        }

        const userId = order?.userId || params.paymentContext?.userId;
        const user = await modules.users.findUserById(userId);
        const email = modules.users.primaryEmail(user)?.address;
        const name = user.profile.displayName || user.username || email;

        const paymentIntent = await createRegistrationIntent(
          { userId, name, email, paymentProviderId },
          transactionContext,
        );
        return paymentIntent.client_secret;
      },

      charge: async ({ paymentIntentId, paymentCredentials }) => {
        if (!paymentIntentId && !paymentCredentials) {
          throw new Error('You have to provide paymentIntentId or paymentCredentials');
        }

        const { order } = params.paymentContext;
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId: order.paymentId,
        });

        const pricing = await modules.orders.pricingSheet(order);

        const paymentIntentObject = paymentIntentId
          ? await stripe.paymentIntents.retrieve(paymentIntentId)
          : await createOrderPaymentIntent(
              { orderPayment, order, pricing },
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

        logger.verbose('Charge postponed because paymentIntent has wrong status', {
          orderPaymentId: paymentIntentObject.id,
        });

        return false;
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Stripe);
