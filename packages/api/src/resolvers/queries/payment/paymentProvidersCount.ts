import { log } from '@unchainedshop/logger';
import { mongodb } from '@unchainedshop/mongodb';
import { Context } from '../../../types.js';
import { PaymentProvider } from '@unchainedshop/core-payment';

export default async function paymentProvidersCount(
  root: never,
  params: mongodb.Filter<PaymentProvider>,
  { modules, userId }: Context,
) {
  log(`query paymentProvidersCount ${params.type}`, { userId });

  return modules.payment.paymentProviders.count(params);
}
