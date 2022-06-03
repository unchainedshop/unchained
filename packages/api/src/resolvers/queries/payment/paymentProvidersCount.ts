import { log } from 'meteor/unchained:logger';
import { PaymentProviderQuery } from '@unchainedshop/types/payments';
import { Context, Root } from '@unchainedshop/types/api';

export default async function paymentProvidersCount(
  root: Root,
  { type }: PaymentProviderQuery,
  { modules, userId }: Context,
) {
  log(`query paymentProvidersCount ${type}`, { userId });

  return modules.payment.paymentProviders.count({ type });
}
