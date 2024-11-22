import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { OrderPaymentStatus } from '@unchainedshop/core-orders';
import {
  OrderPaymentConfigurationError,
  OrderPaymentNotFoundError,
  OrderPaymentTypeError,
  OrderWrongPaymentStatusError,
  UserNoCartError,
} from '../../../errors.js';

export default async function signPaymentProviderForCheckout(
  root: never,
  params: { orderPaymentId: string; transactionContext: any },
  context: Context,
) {
  const { modules, userId } = context;
  const { orderPaymentId, transactionContext } = params;

  log(`mutation signPaymentProviderForCheckout ${orderPaymentId}`, {
    userId,
  });

  let orderPayment;

  if (orderPaymentId) {
    orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId,
    });
    if (!orderPayment) throw new OrderPaymentNotFoundError({ orderPaymentId });
  } else {
    const order = await modules.orders.cart({
      countryContext: context.countryContext || context.user.lastLogin?.countryCode,
      userId,
    });
    if (!order) throw new UserNoCartError({ userId });
    orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    });
    if (!orderPayment) throw new OrderPaymentNotFoundError({ orderPaymentId });
  }

  const provider = await modules.payment.paymentProviders.findProvider({
    paymentProviderId: orderPayment.paymentProviderId,
  });
  const providerType = provider?.type;

  if (providerType !== PaymentProviderType.GENERIC)
    throw new OrderPaymentTypeError({
      orderPaymentId,
      received: providerType,
      required: PaymentProviderType.GENERIC,
    });

  if (modules.orders.payments.normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) {
    throw new OrderWrongPaymentStatusError({
      status: orderPayment.status,
    });
  }

  try {
    const sign = await modules.payment.paymentProviders.sign(
      provider._id,
      {
        userId,
        orderPayment,
        transactionContext,
      },
      context,
    );
    return sign;
  } catch (error) {
    throw new OrderPaymentConfigurationError(error);
  }
}
