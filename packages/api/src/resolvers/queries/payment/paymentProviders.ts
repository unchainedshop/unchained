import { log } from 'meteor/unchained:logger';
import { PaymentProviderQuery } from '@unchainedshop/types/payments';
import { Context, Root } from '@unchainedshop/types/api';

export default async function paymentProviders(
  root: Root,
  { type }: PaymentProviderQuery,
  { modules, userId }: Context,
) {
  log(`query paymentProvider ${type}`, { userId });

  return modules.payment.paymentProviders.findProviders({ type });
}
