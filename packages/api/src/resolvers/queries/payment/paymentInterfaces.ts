import { log } from '@unchainedshop/logger';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { Context } from '../../../context.js';
import { PaymentDirector } from '@unchainedshop/core';

export default async function paymentInterfaces(
  root: never,
  { type }: { type: PaymentProviderType },
  { userId }: Context,
) {
  log(`query paymentInterfaces ${type}`, { userId });

  const allAdapters = await PaymentDirector.getAdapters();

  const filteredAdapters = type
    ? allAdapters.filter((Adapter) => Adapter.typeSupported(type as PaymentProviderType))
    : allAdapters;

  return filteredAdapters.map((Adapter) => ({
    _id: Adapter.key,
    label: Adapter.label,
    version: Adapter.version,
  }));
}
