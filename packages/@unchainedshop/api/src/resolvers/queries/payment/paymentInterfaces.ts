import { log } from '@unchainedshop/logger';
import { PaymentProviderType } from '@unchainedshop/types/payments';
import { Context, Root } from '@unchainedshop/types/api';

export default async function paymentInterfaces(
  root: Root,
  { type }: { type: PaymentProviderType },
  { modules, userId }: Context,
) {
  log(`query paymentInterfaces ${type}`, { userId });

  return modules.payment.paymentProviders.findInterfaces({ type });
}
