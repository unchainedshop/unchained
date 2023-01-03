import { log } from '@unchainedshop/logger';
import { PaymentProviderQuery } from '@unchainedshop/types/payments.js';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function paymentProviders(
  root: Root,
  params: PaymentProviderQuery,
  { modules, userId }: Context,
) {
  log(`query paymentProvider ${params.type}`, { userId });

  return modules.payment.paymentProviders.findProviders(params);
}
