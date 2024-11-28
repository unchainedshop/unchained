import { log } from '@unchainedshop/logger';
import { PaymentDirector, PaymentProviderType } from '@unchainedshop/core-payment';
import { Context } from '../../../context.js';

export default async function paymentInterfaces(
  root: never,
  { type }: { type: PaymentProviderType },
  { userId }: Context,
) {
  log(`query paymentInterfaces ${type}`, { userId });

  return PaymentDirector.getAdapters()
    .filter((Adapter) => Adapter.typeSupported(type))
    .map((Adapter) => ({
      _id: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
    }));
}
