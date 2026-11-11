import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import { Payrexx } from './adapter.ts';

const logger = createLogger('unchained:payrexx');

const assertReferenceId = (referenceId: unknown): string => {
  if (typeof referenceId !== 'string' || !referenceId) {
    throw new Error('referenceId has to be a non-empty string', { cause: 'PAYREXX_WEBHOOK_INVALID' });
  }
  return referenceId;
};

const assertPayrexxProvider = async (paymentProviderId: string, modules: UnchainedCore['modules']) => {
  const provider = await modules.payment.paymentProviders.findProvider({ paymentProviderId });
  if (provider?.adapterKey !== Payrexx.key) {
    throw new Error(`payment provider ${paymentProviderId} is not a Payrexx provider`, {
      cause: 'PAYREXX_WEBHOOK_INVALID',
    });
  }
};

const resolvePayrexxPaymentProviderId = async (
  referenceId: unknown,
  modules: UnchainedCore['modules'],
) => {
  const paymentProviderId = assertReferenceId(referenceId);
  await assertPayrexxProvider(paymentProviderId, modules);
  return paymentProviderId;
};

const resolvePayrexxOrderPayment = async (referenceId: unknown, modules: UnchainedCore['modules']) => {
  const orderPaymentId = assertReferenceId(referenceId);
  const orderPayment = await modules.orders.payments.findOrderPayment({ orderPaymentId });
  if (!orderPayment) {
    throw new Error(`Order payment not found with orderPaymentId: ${orderPaymentId}`, {
      cause: 'PAYREXX_WEBHOOK_INVALID',
    });
  }
  await assertPayrexxProvider(orderPayment.paymentProviderId, modules);
  return orderPayment;
};

export async function payrexxWebhookHandler(
  request: Request,
  context: UnchainedCore,
): Promise<Response> {
  try {
    const { modules, services } = context;

    // Parse JSON body
    const body = (await request.json()) as Record<string, any>;
    const { transaction } = body;

    if (!transaction) {
      logger.info('Unhandled event type', {
        type: Object.keys(body).join(','),
      });
      return new Response(
        JSON.stringify({
          ignored: true,
          message: `Unhandled event type: ${Object.keys(body).join(',')}. Supported type: transaction`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (transaction.referenceId === '__IGNORE_WEBHOOK__' || transaction.status === 'waiting') {
      // Ignore confirmed transactions, because those hooks are generated through calling the confirm()
      // method in the payment adapter and could lead to double bookings.
      logger.info(`Unhandled transaction state: ${transaction.status}`);
      return new Response(
        JSON.stringify({
          ignored: true,
          message: `Unhandled transaction state: ${transaction.status}`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    logger.info('Processing event', {
      transactionId: transaction.id,
    });

    if (transaction.preAuthorizationId) {
      // Pre-Authorization Flow, referenceId is a userId
      const { invoice } = transaction;
      const paymentProviderId = await resolvePayrexxPaymentProviderId(transaction.referenceId, modules);
      const userId = '';
      logger.info(`Register credentials for: ${userId}`);

      await services.orders.registerPaymentCredentials(paymentProviderId, {
        userId,
        transactionContext: { gatewayId: invoice.paymentRequestId },
      });

      logger.info('Registration successful', {
        paymentProviderId,
        userId,
      });

      return new Response(
        JSON.stringify({
          message: 'registration successful',
          paymentProviderId,
          userId,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } else {
      const { invoice } = transaction;
      const orderPayment = await resolvePayrexxOrderPayment(transaction.referenceId, modules);
      const orderPaymentId = orderPayment._id;
      logger.info(`Checkout with orderPaymentId: ${orderPaymentId}`);

      await modules.orders.payments.logEvent(orderPaymentId, {
        transactionId: transaction.id,
      });

      const order = await services.orders.checkoutOrder(orderPayment.orderId, {
        paymentContext: {
          gatewayId: invoice.paymentRequestId,
        },
      });

      if (!order) {
        throw new Error(`Order with id ${orderPayment.orderId} not found`);
      }

      logger.info('Checkout successful', {
        orderPaymentId,
        orderId: order._id,
      });

      return new Response(
        JSON.stringify({
          message: 'checkout successful',
          orderId: order._id,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  } catch (error: any) {
    logger.error('Payrexx webhook error:', error);
    return new Response(
      JSON.stringify({
        message: error.message,
        name: error.name,
      }),
      {
        status: error?.cause === 'PAYREXX_WEBHOOK_INVALID' ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
