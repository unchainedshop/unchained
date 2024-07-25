import { log } from '@unchainedshop/logger';
import { PaymentProviderType } from '@unchainedshop/types/payments.js';
import { Context } from '../../../types.js';

export default async function paymentInterfaces(
  root: never,
  { type }: { type: PaymentProviderType },
  { modules, userId }: Context,
) {
  log(`query paymentInterfaces ${type}`, { userId });

  return modules.payment.paymentProviders.findInterfaces({ type });
}
