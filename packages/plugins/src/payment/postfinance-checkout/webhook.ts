import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import type { WebhookData } from './types.ts';
import { getTransaction, getTransactionCompletion } from './api.ts';

const logger = createLogger('unchained:postfinance-checkout');

export async function postfinanceCheckoutWebhookHandler(
  request: Request,
  context: UnchainedCore,
): Promise<Response> {
  try {
    const { services, modules } = context;

    // Parse JSON body
    const data = (await request.json()) as WebhookData;

    if (data.listenerEntityTechnicalName === 'TransactionCompletion') {
      const transactionCompletion = await getTransactionCompletion(data.entityId as unknown as string);
      const transaction = await getTransaction(
        transactionCompletion ? (transactionCompletion as any).linkedTransaction : data.entityId,
      );
      const { orderPaymentId } = transaction.metaData as { orderPaymentId: string };
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId,
      });

      if (!orderPayment) {
        throw new Error('Order Payment not found');
      }

      const order = await services.orders.checkoutOrder(orderPayment.orderId, {
        paymentContext: {
          transactionId: transactionCompletion.linkedTransaction,
        },
      });

      if (!order) {
        throw new Error(`Order with id ${orderPayment.orderId} not found`);
      }

      logger.info(
        `Transaction ${transactionCompletion.linkedTransaction} marked order payment ID ${transaction.metaData?.orderPaymentId} as paid`,
      );

      return new Response(JSON.stringify({ orderNumber: order.orderNumber }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      logger.error(`Received unknown listenerEntityTechnicalName ${data.listenerEntityTechnicalName}`);
      return new Response(null, { status: 404 });
    }
  } catch (error: any) {
    logger.error('Postfinance Checkout webhook error:', error);
    return new Response(
      JSON.stringify({
        name: error.name,
        code: error.code,
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
