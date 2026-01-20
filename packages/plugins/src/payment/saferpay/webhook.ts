import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import { timingSafeStringEqual } from '@unchainedshop/utils';
import { buildSignature } from './buildSignature.ts';

const logger = createLogger('unchained:saferpay');

export async function saferpayWebhookHandler(
  request: Request,
  context: UnchainedCore,
): Promise<Response> {
  try {
    const { modules, services } = context;

    // Parse query parameters from URL
    const url = new URL(request.url);
    const orderPaymentId = url.searchParams.get('orderPaymentId');
    const signature = url.searchParams.get('signature');
    const transactionId = url.searchParams.get('transactionId');

    const isValidRequest =
      typeof orderPaymentId === 'string' &&
      typeof signature === 'string' &&
      typeof transactionId === 'string' &&
      orderPaymentId &&
      transactionId &&
      signature;

    if (!isValidRequest) {
      logger.warn('Missing required query parameters');
      return new Response(null, { status: 404 });
    }

    logger.info(`Checkout with orderPaymentId: ${orderPaymentId}`);

    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId,
    });

    if (!orderPayment) {
      throw new Error(`Order payment not found with orderPaymentId: ${orderPaymentId}`);
    }

    const correctSignature = await buildSignature(transactionId, orderPaymentId);

    // Use timing-safe comparison to prevent signature timing attacks
    if (!(await timingSafeStringEqual(correctSignature, signature))) {
      throw new Error('Invalid signature');
    }

    const order = await services.orders.checkoutOrder(orderPayment.orderId, {
      paymentContext: {
        transactionId,
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
        orderPaymentId,
        orderId: order._id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error: any) {
    logger.error('Saferpay webhook error:', error);
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
