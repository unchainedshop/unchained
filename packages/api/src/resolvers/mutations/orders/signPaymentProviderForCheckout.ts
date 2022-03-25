import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { PaymentProviderType } from 'meteor/unchained:core-payment';

import {
  InvalidIdError,
  OrderPaymentConfigurationError,
  OrderPaymentNotFoundError,
  OrderPaymentTypeError,
} from '../../../errors';

export default async function signPaymentProviderForCheckout(
  root: Root,
  params: { orderPaymentId: string; transactionContext: any },
  context: Context,
) {
  const { modules, userId } = context;
  const { orderPaymentId, transactionContext } = params;

  log(`mutation signPaymentProviderForCheckout ${orderPaymentId}`, {
    userId,
  });

  if (!orderPaymentId) throw new InvalidIdError({ orderPaymentId });

  const orderPayment = await modules.orders.payments.findOrderPayment({
    orderPaymentId,
  });
  if (!orderPayment) throw new OrderPaymentNotFoundError({ orderPaymentId });

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

  try {
    return modules.payment.paymentProviders.sign(
      provider._id,
      {
        orderPayment,
        paymentProvider: provider,
        paymentProviderId: provider._id,
        transactionContext,
      },
      context,
    );
  } catch (error) {
    throw new OrderPaymentConfigurationError(error);
  }
}
