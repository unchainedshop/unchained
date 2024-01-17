import { log } from '@unchainedshop/logger';
import { mongodb } from '@unchainedshop/mongodb';
import { Context, Root } from '@unchainedshop/types/api.js';
import { PaymentProvider } from '@unchainedshop/types/payments.js';

export default async function paymentProvidersCount(
  root: Root,
  params: mongodb.Filter<PaymentProvider>,
  { modules, userId }: Context,
) {
  log(`query paymentProvidersCount ${params.type}`, { userId });

  return modules.payment.paymentProviders.count(params);
}
