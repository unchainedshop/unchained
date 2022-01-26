import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError } from '../../../errors';

export default async function paymentProvider(
  root: Root,
  { paymentProviderId }: { paymentProviderId: string },
  { modules, userId }: Context,
) {
  log(`query paymentProvider ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  return modules.payment.paymentProviders.findProvider({
    paymentProviderId,
  });
}
