import { log } from '@unchainedshop/logger';
import { PaymentProviderQuery } from '@unchainedshop/types/payments';
import { Context, Root } from '@unchainedshop/types/api';

export default async function paymentProvidersCount(
  root: Root,
  params: PaymentProviderQuery,
  { modules, userId }: Context,
) {
  log(`query paymentProvidersCount ${params.type}`, { userId });

  return modules.payment.paymentProviders.count(params);
}
