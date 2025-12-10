import { type Context } from '@unchainedshop/api';
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { createLogger } from '@unchainedshop/logger';
import { fixPeriods } from './fix-periods.ts';
import { type FastifyRequest, type RouteHandlerMethod } from 'fastify';
import { type AppleTransactionsModule } from './module.ts';

const logger = createLogger('unchained:apple-iap:handler');

const { APPLE_IAP_SHARED_SECRET } = process.env;

const AppleNotificationTypes = {
  INITIAL_BUY: 'INITIAL_BUY',
  DID_RECOVER: 'DID_RECOVER',
  DID_CHANGE_RENEWAL_STATUS: 'DID_CHANGE_RENEWAL_STATUS',
  DID_FAIL_TO_RENEW: 'DID_FAIL_TO_RENEW',
  DID_CHANGE_RENEWAL_PREF: 'DID_CHANGE_RENEWAL_PREF',
};

export const appleIAPHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: Context & {
      modules: AppleTransactionsModule;
    };
  },
  reply,
) => {
  try {
    const resolvedContext = req.unchainedContext as Context;
    const { modules, services } = resolvedContext;
    const responseBody: Record<string, any> = req.body || {};
    if (responseBody.password !== APPLE_IAP_SHARED_SECRET) {
      throw new Error('shared secret not valid');
    }

    const transactions = responseBody?.unified_receipt?.latest_receipt_info;
    const latestTransaction = transactions[0];

    if (responseBody.notification_type === AppleNotificationTypes.INITIAL_BUY) {
      // Find the cart to checkout
      const orderPayment = await modules.orders.payments.findOrderPaymentByContextData({
        context: {
          'meta.transactionIdentifier': latestTransaction.transaction_id,
        },
      });

      if (!orderPayment) throw new Error('Could not find any matching order payment');

      const order = await services.orders.checkoutOrder(orderPayment.orderId, {
        paymentContext: {
          receiptData: responseBody?.unified_receipt?.latest_receipt,
        },
      });

      if (!order) throw new Error(`Order with id ${orderPayment.orderId} not found`);

      const orderId = order._id;
      const enrollment = await modules.enrollments.findEnrollment({
        orderId,
      });

      if (!enrollment) throw new Error('Enrollent not found');

      await fixPeriods(
        {
          transactionId: latestTransaction.original_transaction_id,
          transactions,
          enrollmentId: enrollment._id,
          orderId,
        },
        resolvedContext,
      );

      logger.info(`Webhook confirmed checkout for order ${order.orderNumber}`, {
        orderId: order._id,
      });
    } else {
      // Just store payment credentials, use the enrollments paymentProvider reference and
      // let the job do the rest
      const originalOrderPayment = await modules.orders.payments.findOrderPaymentByContextData({
        context: {
          'meta.transactionIdentifier': latestTransaction.original_transaction_id,
        },
      });
      if (!originalOrderPayment) throw new Error('Could not find any matching order payment');
      const originalOrder = await modules.orders.findOrder({
        orderId: originalOrderPayment.orderId,
      });
      const enrollment =
        originalOrder &&
        (await modules.enrollments.findEnrollment({
          orderId: originalOrder._id,
        }));

      if (!enrollment?.payment) throw new Error('Could not find a valid enrollment payment method');

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
        resolvedContext,
      );

      logger.info(
        `Webhook rocessed notification for ${latestTransaction.original_transaction_id} and type ${responseBody.notification_type}`,
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
      logger.info(`Apple IAP Webhook: Updated enrollment from Apple`);
    }

    reply.status(200);
    return reply.send();
  } catch (e) {
    logger.error(e);
    reply.status(503);
    return reply.send({ success: false, name: e.name, code: e.code, message: e.message });
  }
};

export default appleIAPHandler;
