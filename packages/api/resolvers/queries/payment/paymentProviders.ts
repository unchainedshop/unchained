import { log } from 'meteor/unchained:logger';
import { PaymentProviderType } from '@unchainedshop/types/payments';
import { Context, Root } from '@unchainedshop/types/api';

export default async function paymentProviders(
  root: Root,
  { type }: { type: PaymentProviderType },
  { modules, userId }: Context
) {
  log(`query paymentProvider ${type}`, { userId });

  return await modules.payment.paymentProviders.findProviders({ type });
}
