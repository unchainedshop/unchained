import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import generateSignature, { Security } from './generateSignature.ts';
import type { StatusResponseSuccess } from './api/types.ts';

const {
  DATATRANS_SIGN_KEY,
  DATATRANS_SIGN2_KEY,
  DATATRANS_SECURITY = Security.DYNAMIC_SIGN,
} = process.env;

const logger = createLogger('unchained:datatrans:handler');

export async function datatransWebhookHandler(
  request: Request,
  context: UnchainedCore,
): Promise<Response> {
  try {
    const { modules, services } = context;
    const signature = request.headers.get('datatrans-signature');

    if (!DATATRANS_SIGN_KEY && !DATATRANS_SIGN2_KEY) {
      logger.warn('No sign key configured');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No sign key configured',
          name: 'NO_SIGN_KEY',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!signature) {
      logger.warn('No signature provided');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No signature provided',
          name: 'NO_SIGNATURE',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Read the raw body as text for signature validation
    const rawBody = await request.text();

    const [rawTimestamp, rawHash] = signature.split(',');
    const [, hash] = rawHash.split('=');
    const [, timestamp] = rawTimestamp.split('=');

    const comparableSignature = await generateSignature({
      security: DATATRANS_SECURITY as any,
      signKey: DATATRANS_SIGN2_KEY! || DATATRANS_SIGN_KEY!,
    })(timestamp, rawBody);

    if (hash !== comparableSignature) {
      logger.error(`hash mismatch: ${signature} / ${comparableSignature}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid Signature',
          name: 'HASH_MISMATCH',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const transaction: StatusResponseSuccess = JSON.parse(rawBody) as StatusResponseSuccess;

    logger.info(`received request`, {
      type: transaction.type,
    });

    if (transaction.status === 'authorized') {
      const userId = transaction.refno2;
      const referenceId = Buffer.from(transaction.refno, 'base64').toString('hex');

      if (transaction.type === 'card_check') {
        const paymentProviderId = referenceId;
        const paymentCredentials = await services.orders.registerPaymentCredentials(paymentProviderId, {
          userId,
          transactionContext: { transactionId: transaction.transactionId },
        });
        logger.info(`registered payment credentials for ${userId}`, {
          userId,
        });
        return new Response(JSON.stringify(paymentCredentials), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (transaction.type === 'payment') {
        const orderPaymentId = referenceId;
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId,
        });
        if (!orderPayment) {
          throw new Error(`Order Payment with id ${orderPaymentId} not found`);
        }

        const order = await services.orders.checkoutOrder(orderPayment.orderId, {
          paymentContext: { userId, transactionId: transaction.transactionId },
        });

        if (!order) {
          throw new Error(`Order with id ${orderPayment.orderId} not found`);
        }

        logger.info(`confirmed checkout for order ${order.orderNumber}`, {
          orderId: order._id,
        });
        return new Response(JSON.stringify(order), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(null, { status: 404 });
  } catch (e: any) {
    logger.error(`rejected to checkout: ${e.name} - ${e.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        name: e.name,
        code: e.code,
        message: e.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
