import {
  OrderPricingSheet,
  type IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
} from '@unchainedshop/core';

const configurationValue = (config: { key: string; value: string | null }[], key: string) =>
  config.find((entry) => entry.key === key)?.value;

const StripeSPT: IPaymentAdapter = {
  ...PaymentAdapter,
  key: 'shop.unchained.payment.acp-stripe-spt',
  label: 'ACP Stripe Shared Payment Token',
  version: '1.0.0',
  initialConfiguration: [
    { key: 'secret', value: null },
    { key: 'stripeVersion', value: '2026-04-22.preview' },
    { key: 'description', value: 'Unchained agentic checkout' },
  ],

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (config, context) => {
    const secret = configurationValue(config, 'secret') || process.env.STRIPE_SECRET;
    const stripeVersion = configurationValue(config, 'stripeVersion') || '2026-04-22.preview';
    const description = configurationValue(config, 'description') || 'Unchained agentic checkout';
    const baseActions = PaymentAdapter.actions(config, context);

    return {
      ...baseActions,
      configurationError() {
        return secret ? null : PaymentError.INCOMPLETE_CONFIGURATION;
      },
      isActive() {
        return Boolean(secret);
      },
      isPayLaterAllowed() {
        return false;
      },
      async charge(transactionContext = {}) {
        const token = transactionContext.acpToken;
        if (!token) throw new Error('ACP delegated payment token is required');
        if (!secret) throw new Error('Stripe secret is not configured');
        if (!context.order || !context.orderPayment) {
          throw new Error('Order and order payment are required');
        }

        const pricing = OrderPricingSheet({
          calculation: context.order.calculation,
          currencyCode: context.order.currencyCode,
        });
        const { amount, currencyCode } = pricing.total({ useNetPrice: false });
        const body = new URLSearchParams({
          amount: String(Math.round(amount)),
          currency: currencyCode.toLowerCase(),
          confirm: 'true',
          description,
          'payment_method_data[shared_payment_granted_token]': token,
          'metadata[orderId]': context.order._id,
          'metadata[orderPaymentId]': context.orderPayment._id,
        });

        const response = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Idempotency-Key': `acp-${context.orderPayment._id}`,
            'Stripe-Version': stripeVersion,
          },
          body,
        });
        const paymentIntent = (await response.json()) as any;

        if (!response.ok) {
          throw new Error(
            paymentIntent?.error?.message ||
              `Stripe Shared Payment Token charge failed (${response.status})`,
          );
        }
        if (paymentIntent.status !== 'succeeded') return false;

        return {
          transactionId: paymentIntent.id,
          status: paymentIntent.status,
          paymentMethod: paymentIntent.payment_method,
        };
      },
    };
  },
};

PaymentDirector.registerAdapter(StripeSPT);
