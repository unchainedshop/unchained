import { log } from '@unchainedshop/logger';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { Context } from '../../../context.js';

export default async function paymentInterfaces(
  root: never,
  { type }: { type: PaymentProviderType },
  { modules, userId }: Context,
) {
  log(`query paymentInterfaces ${type}`, { userId });

  return modules.payment.paymentProviders.findInterfaces({ type });
}
