import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { fixPeriods } from './fix-periods.ts';

const logger = createLogger('unchained:apple-iap');
const { APPLE_IAP_SHARED_SECRET } = process.env;

const AppleNotificationTypes = {
  INITIAL_BUY: 'INITIAL_BUY',
  DID_RECOVER: 'DID_RECOVER',
  DID_CHANGE_RENEWAL_STATUS: 'DID_CHANGE_RENEWAL_STATUS',
  DID_FAIL_TO_RENEW: 'DID_FAIL_TO_RENEW',
  DID_CHANGE_RENEWAL_PREF: 'DID_CHANGE_RENEWAL_PREF',
};

export async function appleIAPWebhookHandler(
  request: Request,
  context: UnchainedCore,
): Promise<Response> {
  try {
    const { modules, services } = context;

    // Parse JSON body
    const responseBody: Record<string, any> = await request.json();

    // Validate shared secret
    if (responseBody.password !== APPLE_IAP_SHARED_SECRET) {
      logger.warn('Apple IAP Webhook: Invalid shared secret');
      return new Response(
        JSON.stringify({
          error: 'Invalid shared secret',
          name: 'AuthenticationError',
          code: 'INVALID_SECRET',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const transactions = responseBody?.unified_receipt?.latest_receipt_info;
    const latestTransaction = transactions?.[0];

    if (!latestTransaction) {
      throw new Error('No transaction found in receipt');
    }

    if (responseBody.notification_type === AppleNotificationTypes.INITIAL_BUY) {
      // Find the cart to checkout
      const orderPayment = await modules.orders.payments.findOrderPaymentByTransactionId(
        latestTransaction.transaction_id,
      );

      if (!orderPayment) {
        throw new Error('Could not find any matching order payment');
      }

      const order = await services.orders.checkoutOrder(orderPayment.orderId, {
        paymentContext: {
          receiptData: responseBody?.unified_receipt?.latest_receipt,
        },
      });

      if (!order) {
        throw new Error(`Order with id ${orderPayment.orderId} not found`);
      }

      const orderId = order._id;
      const enrollment = await modules.enrollments.findEnrollment({
        orderId,
      });

      if (!enrollment) {
        throw new Error('Could not find any matching enrollment');
      }

      await fixPeriods(
        {
          transactionId: latestTransaction.original_transaction_id,
          transactions,
          enrollmentId: enrollment._id,
          orderId,
        },
        context,
      );

      logger.info(`Apple IAP Webhook: Confirmed checkout for order ${order.orderNumber}`, {
        orderId: order._id,
      });
    } else {
      // Just store payment credentials, use the enrollments paymentProvider reference and
      // let the job do the rest
      const originalOrderPayment = await modules.orders.payments.findOrderPaymentByTransactionId(
        latestTransaction.original_transaction_id,
      );

      if (!originalOrderPayment) {
        throw new Error('Could not find any matching order payment');
      }

      const originalOrder = await modules.orders.findOrder({
        orderId: originalOrderPayment.orderId,
      });

      const enrollment =
        originalOrder &&
        (await modules.enrollments.findEnrollment({
          orderId: originalOrder._id,
        }));

      if (!enrollment?.payment) {
        throw new Error('Could not find a valid enrollment payment method');
      }

      await services.orders.registerPaymentCredentials(enrollment.payment.paymentProviderId, {
        transactionContext: {
          receiptData: responseBody?.unified_receipt?.latest_receipt,
        },
        userId: enrollment.userId,
      });

      await fixPeriods(
        {
          transactionId: latestTransaction.original_transaction_id,
          transactions,
          enrollmentId: enrollment._id,
          orderId: originalOrder!._id,
        },
        context,
      );

      logger.info(
        `Apple IAP Webhook: Processed notification for ${latestTransaction.original_transaction_id} and type ${responseBody.notification_type}`,
      );

      if (responseBody.notification_type === AppleNotificationTypes.DID_RECOVER) {
        if (
          enrollment.status !== EnrollmentStatus.TERMINATED &&
          responseBody.auto_renew_status === 'false'
        ) {
          await services.enrollments.terminateEnrollment(enrollment);
        }
      }

      if (responseBody.notification_type === AppleNotificationTypes.DID_CHANGE_RENEWAL_STATUS) {
        if (
          enrollment.status !== EnrollmentStatus.TERMINATED &&
          responseBody.auto_renew_status === 'false'
        ) {
          await services.enrollments.terminateEnrollment(enrollment);
        }
      }

      logger.info('Apple IAP Webhook: Updated enrollment from Apple');
    }

    return new Response(null, { status: 200 });
  } catch (error: any) {
    logger.error('Apple IAP Webhook error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        name: error.name,
        code: error.code,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
