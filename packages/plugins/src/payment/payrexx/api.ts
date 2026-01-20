import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';

const logger = createLogger('unchained:payrexx');

export async function payrexxWebhookHandler(
  request: Request,
  context: UnchainedCore,
): Promise<Response> {
  try {
    const { modules, services } = context;

    // Parse JSON body
    const body: Record<string, any> = await request.json();
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
      const { referenceId: paymentProviderId, invoice } = transaction;
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
      const { referenceId: orderPaymentId, invoice } = transaction;
      logger.info(`Checkout with orderPaymentId: ${orderPaymentId}`);

      await modules.orders.payments.logEvent(orderPaymentId, {
        transactionId: transaction.id,
      });

      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId,
      });

      if (!orderPayment) {
        throw new Error(`Order payment not found with orderPaymentId: ${orderPaymentId}`);
      }

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
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
